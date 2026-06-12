'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CurrentWeather from '@/components/weather/CurrentWeather';
import HourlyForecast from '@/components/weather/HourlyForecast';
import DailyForecast from '@/components/weather/DailyForecast';
import TemperatureChart from '@/components/weather/TemperatureChart';
import { POPULAR_CITIES, DEFAULT_CITY } from '@/lib/constants';
import { useWeather } from '@/hooks/useWeather';
import { City, MapCity } from '@/types/weather';
import { Loader2, Clock, Map, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPopularCityList } from '@/data/cities';
import { weatherService } from '@/services/weather';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
      role="status"
      aria-label="Caricamento mappa"
    >
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

export default function WeatherPageClient() {
  const { weather, loading, error, fetchWeather } = useWeather();
  const [mapCities, setMapCities] = useState<MapCity[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    void fetchWeather(DEFAULT_CITY);
  }, [fetchWeather]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      getPopularCityList().map((city) =>
        weatherService.getWeatherByCity(city).catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const cities: MapCity[] = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => ({
          name: r.city.name,
          displayName: r.city.displayName,
          region: r.city.region,
          lat: r.city.lat,
          lon: r.city.lon,
          temperature: r.current.temperature,
          windSpeed: r.current.windSpeed,
          windDirection: r.current.windDirection,
          pressure: r.current.pressure,
          humidity: r.current.humidity,
          precipitation: r.current.precipitation,
        }));
      setMapCities(cities);
      setMapLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCitySelect = useCallback(
    async (city: City) => {
      await fetchWeather(city);
    },
    [fetchWeather],
  );

  const handleQuickCitySelect = useCallback(
    (cityName: string) => {
      router.push(`/citta/${cityName}/`);
    },
    [router],
  );

  const handleRetry = useCallback(() => {
    void fetchWeather(DEFAULT_CITY);
  }, [fetchWeather]);

  const mapCenter: [number, number] = weather
    ? [weather.city.lat, weather.city.lon]
    : [41.9, 12.5];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header onCitySelect={handleCitySelect} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">
              Previsioni Meteo Italia
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Scopri il meteo aggiornato per tutte le città italiane
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleQuickCitySelect(city.name)}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all"
              >
                {city.displayName}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="flex items-center justify-center py-20" role="status">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Caricamento meteo...</span>
          </div>
        )}

        {error && (
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
            role="alert"
          >
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Riprova
            </button>
          </div>
        )}

        {weather && !loading && (
          <div className="space-y-6">
            <CurrentWeather weather={weather} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyForecast
                hourly={weather.hourly}
                citySlug={weather.city.name}
                date={weather.daily[0]?.date}
              />
              <TemperatureChart hourly={weather.hourly} />
            </div>

            <DailyForecast daily={weather.daily} citySlug={weather.city.name} />
          </div>
        )}

        <section className="mt-8" aria-labelledby="map-heading">
          <h2
            id="map-heading"
            className="text-2xl font-bold mb-4 text-slate-800 dark:text-white"
          >
            Mappa Meteo Italia
          </h2>
          {mapLoading ? (
            <div
              className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
              role="status"
            >
              <span className="text-slate-400">Caricamento dati mappa...</span>
            </div>
          ) : (
            <WeatherMap cities={mapCities} center={mapCenter} />
          )}
        </section>

        <section className="mt-12 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
            Perché scegliere MeteoItalia?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-blue-500" />}
              title="Aggiornamenti in Tempo Reale"
              description="Dati meteorologici aggiornati ogni ora per garantire la massima precisione."
            />
            <FeatureCard
              icon={<Map className="w-8 h-8 text-green-500" />}
              title="Mappe Interattive"
              description="Esplora il meteo su mappe dettagliate con radar, satelliti e previsioni."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-purple-500" />}
              title="Previsioni Affidabili"
              description="Algoritmi avanzati per previsioni accurate fino a 7 giorni."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
