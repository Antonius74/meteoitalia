'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ExternalLink, Wind, Thermometer, CloudRain, Gauge, Map as MapIcon } from 'lucide-react';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

const mapCities = [
  { name: 'roma', displayName: 'Roma', region: 'Lazio', lat: 41.9028, lon: 12.4964, temperature: 22, condition: 'clear', windSpeed: 12, windDirection: 45, pressure: 1013, humidity: 65, precipitation: 0 },
  { name: 'milano', displayName: 'Milano', region: 'Lombardia', lat: 45.4642, lon: 9.1900, temperature: 19, condition: 'cloudy', windSpeed: 8, windDirection: 90, pressure: 1010, humidity: 70, precipitation: 0.5 },
  { name: 'napoli', displayName: 'Napoli', region: 'Campania', lat: 40.8518, lon: 14.2681, temperature: 24, condition: 'partly-cloudy', windSpeed: 15, windDirection: 180, pressure: 1015, humidity: 60, precipitation: 0 },
  { name: 'torino', displayName: 'Torino', region: 'Piemonte', lat: 45.0703, lon: 7.6869, temperature: 18, condition: 'rain', windSpeed: 20, windDirection: 270, pressure: 1008, humidity: 80, precipitation: 3.2 },
  { name: 'palermo', displayName: 'Palermo', region: 'Sicilia', lat: 38.1157, lon: 13.3615, temperature: 26, condition: 'clear', windSpeed: 10, windDirection: 135, pressure: 1016, humidity: 55, precipitation: 0 },
  { name: 'genova', displayName: 'Genova', region: 'Liguria', lat: 44.4056, lon: 8.9463, temperature: 20, condition: 'partly-cloudy', windSpeed: 18, windDirection: 315, pressure: 1011, humidity: 75, precipitation: 0.2 },
  { name: 'bologna', displayName: 'Bologna', region: 'Emilia-Romagna', lat: 44.4949, lon: 11.3426, temperature: 21, condition: 'cloudy', windSpeed: 6, windDirection: 0, pressure: 1009, humidity: 72, precipitation: 0.1 },
  { name: 'firenze', displayName: 'Firenze', region: 'Toscana', lat: 43.7696, lon: 11.2558, temperature: 23, condition: 'clear', windSpeed: 5, windDirection: 225, pressure: 1014, humidity: 58, precipitation: 0 },
  { name: 'bari', displayName: 'Bari', region: 'Puglia', lat: 41.1171, lon: 16.8719, temperature: 25, condition: 'clear', windSpeed: 14, windDirection: 160, pressure: 1015, humidity: 62, precipitation: 0 },
  { name: 'venezia', displayName: 'Venezia', region: 'Veneto', lat: 45.4408, lon: 12.3155, temperature: 20, condition: 'cloudy', windSpeed: 22, windDirection: 45, pressure: 1007, humidity: 78, precipitation: 1.5 },
];

export default function MappePage() {
  const [activeLayer, setActiveLayer] = useState<'temp' | 'wind' | 'rain' | 'pressure'>('temp');

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Mappe Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Esplora la mappa interattiva con le principali città italiane e approfondimenti su Windy.com.
          </p>
        </div>

        {/* Mappa interattiva */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-white">Mappa Temperature Italia</span>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'temp', label: 'Temp', icon: Thermometer },
                { id: 'wind', label: 'Vento', icon: Wind },
                { id: 'rain', label: 'Pioggia', icon: CloudRain },
                { id: 'pressure', label: 'Pressione', icon: Gauge },
              ].map((layer) => {
                const Icon = layer.icon;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id as any)}
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
          <WeatherMap cities={mapCities} center={[41.9, 12.5]} zoom={6} activeLayer={activeLayer} />
        </div>

        {/* Link a mappe esterne */}
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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                      {map.title}
                    </h2>
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
      </div>

      <Footer />
    </div>
  );
}
