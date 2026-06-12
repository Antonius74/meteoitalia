import { NewsItem, NewsCategory, NewsFeed } from '@/types/news';
import { hashId, parseRss, stripHtml } from '@/lib/rssParser';

interface RssSource {
  name: string;
  url: string;
  defaultCategory: NewsCategory;
}

const RSS_SOURCES: RssSource[] = [
  {
    name: 'Google News - Meteo Italia',
    url: 'https://news.google.com/rss/search?q=meteo+OR+previsioni+OR+maltempo+italia&hl=it&gl=IT&ceid=IT:it',
    defaultCategory: 'Previsioni',
  },
  {
    name: 'ANSA - Cronaca',
    url: 'https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml',
    defaultCategory: 'Cronaca',
  },
];

const CATEGORY_KEYWORDS: Array<{ category: NewsCategory; words: string[] }> = [
  {
    category: 'Allerta',
    words: ['allerta', 'allarme', 'emergenza', 'evacuazion', 'alluvion', 'cigno nero', 'rossa', 'arancione'],
  },
  {
    category: 'Maltempo',
    words: [
      'maltempo',
      'temporale',
      'temporali',
      'nubifragio',
      'grandine',
      'grandinata',
      'nevicata',
      'nevicate',
      'bomba',
      "d'acqua",
      'pioggia',
      'piogge',
      'piogga',
      'frana',
      'frane',
      'esondaz',
      'alluvion',
      'tornado',
      'tromba d’aria',
      'tromba d’aria',
    ],
  },
  {
    category: 'Previsioni',
    words: [
      'previsioni',
      'meteo',
      'meteo.it',
      '3bmeteo',
      'ilmeteo',
      'meteoam',
      'temperature',
      'caldo',
      'freddo',
      'afa',
      'ondata di calore',
      'anticiclone',
      'perturbazione',
      'alta pressione',
      'bassa pressione',
      'weekend',
    ],
  },
  {
    category: 'Clima',
    words: [
      'clima',
      'climatico',
      'climatiche',
      'sostenibilit',
      'riscaldamento globale',
      'effetto serra',
      'co2',
      'greenhouse',
      'nio',
      'el nino',
      'la nina',
      'desertific',
      'ghiaccia',
      'antartide',
      'artide',
    ],
  },
];

function categorize(title: string, description: string, fallback: NewsCategory): NewsCategory {
  const text = `${title} ${description}`.toLowerCase();
  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      return category;
    }
  }
  return fallback;
}

function buildItemId(link: string, title: string): string {
  return hashId(`${link}|${title}`);
}

function isWeatherRelated(item: { title: string; description: string }): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const weatherWords = [
    'meteo',
    'previsioni',
    'maltempo',
    'temporale',
    'temporali',
    'nubifragio',
    'grandine',
    'neve',
    'nevicat',
    'pioggia',
    'piogge',
    'allerta',
    'alluvion',
    'frana',
    'frane',
    'tornado',
    'tromba',
    'caldo',
    'afa',
    'freddo',
    'gelo',
    'ondata',
    'anticiclone',
    'perturbazione',
    'temperature',
    'meteoam',
    '3bmeteo',
    'ilmeteo',
    'climate',
    'clima',
    'climatic',
    'sostenibil',
    'co2',
    'antartide',
    'ghiaccia',
    'esondaz',
    'bomba d’acqua',
    'bomba d\'acqua',
  ];
  return weatherWords.some((w) => text.includes(w));
}

function parseDate(pubDate: string): string {
  if (!pubDate) return new Date().toISOString();
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

class NewsService {
  private async fetchXml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MeteoItaliaBot/1.0; +https://meteoitalia.it)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 1800 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.text();
  }

  async getAllFeeds(): Promise<NewsFeed[]> {
    const results = await Promise.allSettled(
      RSS_SOURCES.map(async (source) => {
        const xml = await this.fetchXml(source.url);
        const items = parseRss(xml, source.name);
        return {
          source: source.name,
          url: source.url,
          items: items.map((item) => ({
            id: buildItemId(item.link, item.title),
            title: item.title,
            description: item.description || stripHtml(''),
            link: item.link,
            pubDate: parseDate(item.pubDate),
            source: item.source || source.name,
            category: categorize(item.title, item.description, source.defaultCategory),
            thumbnail: item.thumbnail,
          })) as NewsItem[],
          fetchedAt: new Date().toISOString(),
        } satisfies NewsFeed;
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<NewsFeed> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  async getWeatherNews(limit = 30): Promise<NewsItem[]> {
    const feeds = await this.getAllFeeds();
    const all = feeds.flatMap((f) => f.items);
    const filtered = all.filter(isWeatherRelated);

    const byId = new Map<string, NewsItem>();
    for (const item of filtered) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }

    return Array.from(byId.values())
      .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
      .slice(0, limit);
  }

  async getItemById(id: string): Promise<NewsItem | null> {
    const items = await this.getWeatherNews(60);
    return items.find((i) => i.id === id) ?? null;
  }
}

export const newsService = new NewsService();
