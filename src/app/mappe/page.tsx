'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ExternalLink, Wind, Thermometer, CloudRain, Gauge, Map as MapIcon } from 'lucide-react';
import { MapCity } from '@/types/weather';
import { getPopularCityList } from '@/data/cities';
import { weatherService } from '@/services/weather';

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

type LayerKey = 'temp' | 'wind' | 'rain' | 'pressure';

export default function MappePage() {
  const [activeLayer, setActiveLayer] = useState<LayerKey>('temp');
  const [cities, setCities] = useState<MapCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      getPopularCityList().map((city) =>
        weatherService.getWeatherByCity(city).catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const mapCities: MapCity[] = results
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
      setCities(mapCities);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const externalMaps = [
    {
      title: 'Temperature',
      description: 'Mappe delle temperature attuali e previste',
      icon: Thermometer,
      url: 'https://www.windy.com/it/-Temperatura-temp?41.902,12.496,5',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Vento',
      description: 'Mappe del vento con direzione e intensità',
      icon: Wind,
      url: 'https://www.windy.com/it/-Vento-wind?41.902,12.496,5',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Nuvole e Pioggia',
      description: 'Satellite e radar delle precipitazioni',
      icon: CloudRain,
      url: 'https://www.windy.com/it/-Pioggia-thunder?41.902,12.496,5',
      color: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Pressione',
      description: 'Mappe barometriche con isobare e fronti',
      icon: Gauge,
      url: 'https://www.windy.com/it/-Pressione-pressure?41.902,12.496,5',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const layers: { id: LayerKey; label: string; icon: React.ElementType }[] = [
    { id: 'temp', label: 'Temp', icon: Thermometer },
    { id: 'wind', label: 'Vento', icon: Wind },
    { id: 'rain', label: 'Pioggia', icon: CloudRain },
    { id: 'pressure', label: 'Pressione', icon: Gauge },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Mappe Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Esplora la mappa interattiva con le principali città italiane e approfondimenti su
            Windy.com.
          </p>
        </div>

        <section
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-8"
          aria-labelledby="mappe-heading"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-500" />
              <span
                id="mappe-heading"
                className="font-semibold text-slate-800 dark:text-white"
              >
                Mappa Temperature Italia
              </span>
            </div>
            <div className="flex gap-2" role="tablist" aria-label="Livelli mappa">
              {layers.map((layer) => {
                const Icon = layer.icon;
                return (
                  <button
                    key={layer.id}
                    role="tab"
                    aria-selected={activeLayer === layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeLayer === layer.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {layer.label}
                  </button>
                );
              })}
            </div>
          </div>
          {loading ? (
            <div
              className="h-[500px] w-full flex items-center justify-center"
              role="status"
            >
              <span className="text-slate-400">Caricamento dati mappa...</span>
            </div>
          ) : (
            <WeatherMap cities={cities} center={[41.9, 12.5]} zoom={6} activeLayer={activeLayer} />
          )}
        </section>

        <section aria-labelledby="external-maps-heading">
          <h2 id="external-maps-heading" className="sr-only">
            Mappe esterne
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {externalMaps.map((map) => {
              const Icon = map.icon;
              return (
                <a
                  key={map.title}
                  href={map.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${map.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                        {map.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{map.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-500">
                        <span>Apri su Windy</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
