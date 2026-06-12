'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { City, WeatherData } from '@/types/weather';
import { Poi, RecurringEvent, CityInfo } from '@/types/poi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CurrentWeather from '@/components/weather/CurrentWeather';
import HourlyForecast from '@/components/weather/HourlyForecast';
import DailyForecast from '@/components/weather/DailyForecast';
import TemperatureChart from '@/components/weather/TemperatureChart';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CityAdvice from '@/components/weather/CityAdvice';
import { WeatherContext } from '@/lib/weatherAdvice';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
      role="status"
    >
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

interface CityPageClientProps {
  weather: WeatherData;
  initialPois?: Poi[];
  initialInfo?: CityInfo | null;
  initialEvents?: RecurringEvent[];
}

export default function CityPageClient({
  weather,
  initialPois = [],
  initialInfo = null,
  initialEvents = [],
}: CityPageClientProps) {
  const router = useRouter();
  const handleCitySelect = useCallback(
    (city: City) => {
      router.push(`/citta/${city.name}/`);
    },
    [router],
  );

  const mapCity = {
    name: weather.city.name,
    displayName: weather.city.displayName,
    region: weather.city.region,
    lat: weather.city.lat,
    lon: weather.city.lon,
    temperature: weather.current.temperature,
    windSpeed: weather.current.windSpeed,
    windDirection: weather.current.windDirection,
    pressure: weather.current.pressure,
    humidity: weather.current.humidity,
    precipitation: weather.current.precipitation,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header onCitySelect={handleCitySelect} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/previsioni" className="hover:text-blue-500">
            Previsioni
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 dark:text-white font-medium">
            {weather.city.displayName}
          </span>
        </nav>

        <CurrentWeather weather={weather} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <HourlyForecast
            hourly={weather.hourly}
            citySlug={weather.city.name}
            date={weather.daily[0]?.date}
          />
          <TemperatureChart hourly={weather.hourly} />
        </div>

        <DailyForecast daily={weather.daily} citySlug={weather.city.name} />

        <div className="mt-8">
          <CityAdvice
            displayName={weather.city.displayName}
            lat={weather.city.lat}
            lon={weather.city.lon}
            weather={{
              weatherCode: weather.current.weatherCode,
              temperature: weather.current.temperature,
              precipitationProbability: weather.daily[0]?.precipitationProbability ?? 0,
              windSpeed: weather.current.windSpeed,
              isDay: weather.current.isDay,
              month: new Date(weather.daily[0]?.date ?? new Date().toISOString()).getMonth() + 1,
            } satisfies WeatherContext}
            initialPois={initialPois}
            initialInfo={initialInfo}
            initialEvents={initialEvents}
          />
        </div>

        <section className="mt-8" aria-labelledby="city-map-heading">
          <h2
            id="city-map-heading"
            className="text-2xl font-bold mb-4 text-slate-800 dark:text-white"
          >
            Mappa {weather.city.displayName}
          </h2>
          <WeatherMap cities={[mapCity]} center={[weather.city.lat, weather.city.lon]} zoom={11} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
