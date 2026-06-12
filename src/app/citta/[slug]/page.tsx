import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { weatherService } from '@/services/weather';
import { findCityBySlug, WORLD_CITIES, getPopularCityList } from '@/data/cities';
import { getStaticPoisForCity, fetchCityInfo, fetchEvents } from '@/services/poi';
import CityPageClient from './CityPageClient';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const seen = new Set<string>();
  const out: { slug: string }[] = [];
  for (const c of [...getPopularCityList(), ...WORLD_CITIES]) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      out.push({ slug: c.name });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  const cityName = city?.displayName ?? slug.charAt(0).toUpperCase() + slug.slice(1);

  return {
    title: `Meteo ${cityName} - Previsioni 7 Giorni | MeteoItalia`,
    description: `Previsioni meteo dettagliate per ${cityName}. Temperature, umidità, vento e precipitazioni aggiornate ogni ora.`,
    openGraph: {
      title: `Meteo ${cityName}`,
      description: `Previsioni meteo per ${cityName}`,
    },
  };
}

async function loadWeather(slug: string) {
  const local = findCityBySlug(slug);
  const city =
    local ?? (await weatherService.searchCities(slug.replace(/-/g, ' ')))[0];
  if (!city) {
    return null;
  }
  return weatherService.getWeatherByCity(city);
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  let weather;
  try {
    weather = await loadWeather(slug);
  } catch (error: unknown) {
    console.error(error);
    notFound();
  }
  if (!weather) {
    notFound();
  }

  const month = new Date(weather.daily[0]?.date ?? new Date().toISOString()).getMonth() + 1;

  const pois = getStaticPoisForCity(
    weather.city.name,
    weather.city.displayName,
    weather.city.lat,
    weather.city.lon,
  );

  const [info, events] = await Promise.all([
    fetchCityInfo(weather.city.displayName).catch(() => null),
    fetchEvents(weather.city.displayName, month).catch(() => []),
  ]);

  return (
    <CityPageClient
      weather={weather}
      initialPois={pois}
      initialInfo={info}
      initialEvents={events}
    />
  );
}
