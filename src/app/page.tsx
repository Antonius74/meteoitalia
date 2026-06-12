import type { Metadata } from 'next';
import WeatherPageClient from './WeatherPageClient';

export const metadata: Metadata = {
  title: 'Meteo Italia - Previsioni Meteo in Tempo Reale',
  description:
    'Previsioni meteo accurate per tutte le città italiane. Temperature, umidità, vento, precipitazioni e mappe interattive.',
  keywords: 'meteo, previsioni, Italia, Roma, Milano, Napoli, Torino, temperatura, pioggia',
  openGraph: {
    title: 'Meteo Italia',
    description: 'Previsioni meteo accurate per tutte le città italiane',
    type: 'website',
  },
};

export default function Home() {
  return <WeatherPageClient />;
}
