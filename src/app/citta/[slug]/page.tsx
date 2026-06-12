import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { weatherService } from '@/services/weather';
import CityPageClient from './CityPageClient';
import { POPULAR_CITIES } from '@/lib/constants';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const allCities = [
    // Italia
    ...POPULAR_CITIES.map(c => c.name),
    // Europa
    'parigi', 'londra', 'berlino', 'madrid', 'amsterdam', 'vienna',
    'zurigo', 'praga', 'budapest', 'varsavia', 'atene', 'lisbona',
    'copenaghen', 'stoccolma', 'helsinki', 'dublino', 'bruxelles',
    // Mondo
    'new-york', 'tokyo', 'sydney', 'dubai', 'rio-de-janeiro',
  ];
  return allCities.map((name) => ({
    slug: name,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);
  
  return {
    title: `Meteo ${cityName} - Previsioni 7 Giorni | MeteoItalia`,
    description: `Previsioni meteo dettagliate per ${cityName}. Temperature, umidità, vento e precipitazioni aggiornate ogni ora.`,
    openGraph: {
      title: `Meteo ${cityName}`,
      description: `Previsioni meteo per ${cityName}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  
  try {
    const cities = await weatherService.searchCities(slug);
    if (cities.length === 0) {
      notFound();
    }
    
    const weather = await weatherService.getWeatherByCity(cities[0]);
    
    return <CityPageClient weather={weather} />;
  } catch (error) {
    console.error(error);
    notFound();
  }
}