import { Poi, PoiCategory, RecurringEvent, CityInfo } from '@/types/poi';
import { STATIC_CITY_POI, FALLBACK_GENERIC_POI } from './poiStatic';

const WIKI_REST = 'https://it.wikipedia.org/api/rest_v1';
const WIKI_EN_REST = 'https://en.wikipedia.org/api/rest_v1';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'MeteoItalia/1.0 (https://meteoitalia.it)';

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function writeCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
}

async function fetchText(url: string, init?: RequestInit, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

interface WikiSummary {
  type?: string;
  title: string;
  description?: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string }; mobile?: { page?: string } };
}

export async function fetchCityInfo(cityName: string): Promise<CityInfo | null> {
  const cacheK = `cityinfo:${cityName.toLowerCase()}`;
  const cached = readCache<CityInfo | null>(cacheK);
  if (cached !== null) return cached;

  for (const base of [WIKI_REST, WIKI_EN_REST]) {
    try {
      const url = `${base}/page/summary/${encodeURIComponent(cityName)}`;
      const text = await fetchText(url);
      const data = JSON.parse(text) as WikiSummary;
      const info: CityInfo = {
        name: data.title,
        description: data.description ?? '',
        extract: stripHtml(data.extract),
        thumbnail: data.thumbnail?.source,
        wikipediaUrl:
          data.content_urls?.desktop?.page ??
          data.content_urls?.mobile?.page ??
          `${base.split('/api')[0]}/wiki/${encodeURIComponent(cityName)}`,
      };
      writeCache(cacheK, info);
      return info;
    } catch {
      /* try next */
    }
  }
  writeCache(cacheK, null);
  return null;
}

const TAG_QUERIES: Array<{ key: string; value: string; category: PoiCategory; indoor: boolean }> = [
  { key: 'tourism', value: 'museum', category: 'museo', indoor: true },
  { key: 'tourism', value: 'attraction', category: 'monumento', indoor: false },
  { key: 'historic', value: 'monument', category: 'monumento', indoor: false },
  { key: 'historic', value: 'castle', category: 'monumento', indoor: false },
  { key: 'historic', value: 'palace', category: 'monumento', indoor: false },
  { key: 'historic', value: 'church', category: 'monumento', indoor: true },
  { key: 'historic', value: 'archaeological_site', category: 'monumento', indoor: false },
  { key: 'leisure', value: 'park', category: 'parco', indoor: false },
  { key: 'leisure', value: 'garden', category: 'passeggiata', indoor: false },
  { key: 'leisure', value: 'nature_reserve', category: 'natura', indoor: false },
  { key: 'natural', value: 'peak', category: 'montagna', indoor: false },
  { key: 'natural', value: 'beach', category: 'spiaggia', indoor: false },
  { key: 'water', value: 'lake', category: 'lago', indoor: false },
  { key: 'amenity', value: 'restaurant', category: 'locali', indoor: true },
  { key: 'amenity', value: 'marketplace', category: 'cibo', indoor: false },
  { key: 'tourism', value: 'zoo', category: 'famiglia', indoor: false },
  { key: 'tourism', value: 'aquarium', category: 'famiglia', indoor: true },
  { key: 'tourism', value: 'theme_park', category: 'famiglia', indoor: false },
  { key: 'leisure', value: 'sports_centre', category: 'sport', indoor: true },
];

function buildOverpassQuery(lat: number, lon: number, radius: number): string {
  const clauses = TAG_QUERIES.map(
    (t) => `node["${t.key}"="${t.value}"](around:${radius},${lat},${lon});`,
  ).join('');
  return `[out:json][timeout:12];(${clauses});out body 60;`;
}

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
interface OverpassResponse {
  elements: OverpassElement[];
}

const FALLBACK_DESCRIPTION: Record<PoiCategory, string> = {
  museo: 'Museo o galleria d\'arte, ideale per scoprire la cultura locale.',
  monumento: 'Monumento o attrazione storica di interesse culturale.',
  natura: 'Area naturale protetta, ideale per escursioni e contatto con la natura.',
  parco: 'Parco urbano o area verde attrezzata.',
  spiaggia: 'Spiaggia o area costiera balneabile.',
  lago: 'Lago o specchio d\'acqua, ideale per relax e sport acquatici.',
  montagna: 'Vetta o area montuosa per escursioni e trekking.',
  passeggiata: 'Giardino storico o area panoramica per passeggiate.',
  locali: 'Quartiere con ristoranti, bar e vita notturna.',
  famiglia: 'Attrazione per famiglie con bambini.',
  sport: 'Struttura sportiva o area attrezzata per attività fisica.',
  cibo: 'Mercato tradizionale o area enogastronomica locale.',
};

function isFamilyFriendly(category: PoiCategory): boolean {
  return ['museo', 'parco', 'spiaggia', 'lago', 'natura', 'famiglia', 'passeggiata'].includes(
    category,
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeWikiLink(link: string): string {
  if (link.startsWith('http')) return link;
  if (link.includes(':')) {
    const [lang, ...rest] = link.split(':');
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(rest.join(':'))}`;
  }
  return `https://it.wikipedia.org/wiki/${encodeURIComponent(link)}`;
}

export function getStaticPoisForCity(
  slug: string,
  displayName: string,
  lat: number,
  lon: number,
): Poi[] {
  const data = STATIC_CITY_POI[slug] ?? STATIC_CITY_POI[displayName.toLowerCase()];
  if (data) {
    return data.pois.map((p, idx) => ({
      ...p,
      id: `static-${slug}-${idx}`,
      lat: data.coords.lat,
      lon: data.coords.lon,
      source: 'fallback' as const,
    }));
  }
  const F = FALLBACK_GENERIC_POI;
  return F.pois.map((p, idx) => ({
    ...p,
    id: `generic-${slug}-${idx}`,
    lat,
    lon,
    source: 'fallback' as const,
  }));
}

export async function fetchPoisForCity(
  lat: number,
  lon: number,
  citySlug: string,
  displayName: string,
  radius = 8000,
): Promise<Poi[]> {
  const cacheK = `pois:${citySlug}`;
  const cached = readCache<Poi[]>(cacheK);
  if (cached && cached.length > 0) return cached;

  const query = buildOverpassQuery(lat, lon, radius);
  const body = new URLSearchParams({ data: query }).toString();

  let overpassPois: Poi[] = [];
  try {
    const text = await fetchText(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = JSON.parse(text) as OverpassResponse;
    const seen = new Set<string>();
    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const match = TAG_QUERIES.find((t) => tags[t.key] === t.value);
      if (!match) continue;
      const name = tags.name ?? tags['name:it'] ?? tags['name:en'];
      if (!name) continue;
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat === undefined || elLon === undefined) continue;
      const key = `${name.toLowerCase()}-${elLat.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const description =
        tags.description ??
        tags['description:it'] ??
        tags['description:en'] ??
        FALLBACK_DESCRIPTION[match.category];
      const wikiRaw = tags.wikipedia ?? tags['contact:website'] ?? tags.website;
      overpassPois.push({
        id: `osm-${el.type}-${el.id}`,
        name,
        category: match.category,
        description: stripHtml(description),
        indoor: match.indoor,
        family: isFamilyFriendly(match.category),
        lat: elLat,
        lon: elLon,
        link: wikiRaw ? normalizeWikiLink(wikiRaw) : undefined,
        source: 'overpass',
      });
    }
  } catch (err) {
    console.warn(`Overpass fetch failed for ${citySlug}, using static fallback:`, err);
  }

  if (overpassPois.length === 0) {
    overpassPois = getStaticPoisForCity(citySlug, displayName, lat, lon);
  }

  writeCache(cacheK, overpassPois);
  return overpassPois;
}

interface WikiEventSearchResult {
  query?: {
    search?: Array<{ pageid: number; title: string; snippet: string }>;
  };
}

const EVENT_KEYWORDS = [
  'festa',
  'festival',
  'fiera',
  'mercato',
  'carnevale',
  'sagra',
  'patronale',
  'notte bianca',
];

export async function fetchEvents(cityName: string, month: number): Promise<RecurringEvent[]> {
  const cacheK = `events:${cityName.toLowerCase()}-${month}`;
  const cached = readCache<RecurringEvent[]>(cacheK);
  if (cached) return cached;

  const monthName = new Date(2000, month - 1, 1).toLocaleDateString('it-IT', { month: 'long' });
  const kw = EVENT_KEYWORDS[(cityName.length + month) % EVENT_KEYWORDS.length];
  const query = `${kw} ${cityName} ${monthName}`;

  try {
    const url = `${WIKI_REST}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5&origin=*`;
    const text = await fetchText(url);
    const data = JSON.parse(text) as WikiEventSearchResult;
    const events: RecurringEvent[] = (data.query?.search ?? []).map((r) => ({
      id: `wiki-event-${r.pageid}`,
      name: stripHtml(r.title),
      type: 'festa',
      description: stripHtml(r.snippet),
      link: `https://it.wikipedia.org/wiki/${encodeURIComponent(stripHtml(r.title))}`,
    }));
    writeCache(cacheK, events);
    return events;
  } catch {
    writeCache(cacheK, []);
    return [];
  }
}
