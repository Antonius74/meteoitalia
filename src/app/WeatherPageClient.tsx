'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CurrentWeather from '@/components/weather/CurrentWeather';
import HourlyForecast from '@/components/weather/HourlyForecast';
import DailyForecast from '@/components/weather/DailyForecast';
import TemperatureChart from '@/components/weather/TemperatureChart';
import SearchBar from '@/components/search/SearchBar';
import { POPULAR_CITIES } from '@/lib/constants';
import { useWeather } from '@/hooks/useWeather';
import { City, WeatherData } from '@/types/weather';
import { Loader2 } from 'lucide-react';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

// Dati mock per la mappa quando non c'è weather
const defaultMapCities = [
  { name: 'roma', displayName: 'Roma', region: 'Lazio', lat: 41.9028, lon: 12.4964, temperature: 22, condition: 'clear' },
  { name: 'milano', displayName: 'Milano', region: 'Lombardia', lat: 45.4642, lon: 9.1900, temperature: 19, condition: 'cloudy' },
  { name: 'napoli', displayName: 'Napoli', region: 'Campania', lat: 40.8518, lon: 14.2681, temperature: 24, condition: 'partly-cloudy' },
  { name: 'torino', displayName: 'Torino', region: 'Piemonte', lat: 45.0703, lon: 7.6869, temperature: 18, condition: 'rain' },
  { name: 'palermo', displayName: 'Palermo', region: 'Sicilia', lat: 38.1157, lon: 13.3615, temperature: 26, condition: 'clear' },
  { name: 'genova', displayName: 'Genova', region: 'Liguria', lat: 44.4056, lon: 8.9463, temperature: 20, condition: 'partly-cloudy' },
  { name: 'bologna', displayName: 'Bologna', region: 'Emilia-Romagna', lat: 44.4949, lon: 11.3426, temperature: 21, condition: 'cloudy' },
  { name: 'firenze', displayName: 'Firenze', region: 'Toscana', lat: 43.7696, lon: 11.2558, temperature: 23, condition: 'clear' },
  { name: 'bari', displayName: 'Bari', region: 'Puglia', lat: 41.1171, lon: 16.8719, temperature: 25, condition: 'clear' },
  { name: 'venezia', displayName: 'Venezia', region: 'Veneto', lat: 45.4408, lon: 12.3155, temperature: 20, condition: 'cloudy' },
];

export default function WeatherPageClient() {
  const { weather, loading, error, fetchWeather } = useWeather();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCitySelect = async (city: City) => {
    setSelectedCity(city);
    await fetchWeather(city);
  };

  const handleQuickCitySelect = (cityName: string) => {
    window.location.href = `/citta/${cityName}/`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">
              Previsioni Meteo Italia
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Scopri il meteo aggiornato per tutte le città italiane
            </p>
          </div>
          
          <div className="flex justify-center">
            <SearchBar onCitySelect={handleCitySelect} />
          </div>

          {/* Quick cities */}
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Caricamento meteo...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchWeather()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Riprova
            </button>
          </div>
        )}

        {/* Weather Content */}
        {weather && !loading && (
          <div className="space-y-6">
            <CurrentWeather weather={weather} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyForecast hourly={weather.hourly} />
              <TemperatureChart hourly={weather.hourly} />
            </div>
            
            <DailyForecast daily={weather.daily} />
          </div>
        )}

        {/* Mappa Italia */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
            Mappa Meteo Italia
          </h2>
          <WeatherMap 
            cities={weather ? [{
              ...weather.city,
              temperature: Math.round(weather.current.temperature),
              condition: 'clear', // Simplified for demo
            }] : defaultMapCities}
            center={weather ? [weather.city.lat, weather.city.lon] : [41.9, 12.5]}
          />
        </div>

        {/* Info section */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
            Perché scegliere MeteoItalia?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Aggiornamenti in Tempo Reale</h3>
              <p className="text-slate-600 dark:text-slate-400">Dati meteorologici aggiornati ogni ora per garantire la massima precisione.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.806-.984A1 1 0 0121 7.618V5.382a1 1 0 00-1-1H5.447a1 1 0 00-.553.894V16.382a1 1 0 00.553.894L9 20z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Mappe Interattive</h3>
              <p className="text-slate-600 dark:text-slate-400">Esplora il meteo su mappe dettagliate con radar, satelliti e previsioni.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Previsioni Affidabili</h3>
              <p className="text-slate-600 dark:text-slate-400">Algoritmi avanzati per previsioni accurate fino a 7 giorni.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}