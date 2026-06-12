'use client';

import dynamic from 'next/dynamic';
import { WeatherData } from '@/types/weather';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CurrentWeather from '@/components/weather/CurrentWeather';
import HourlyForecast from '@/components/weather/HourlyForecast';
import DailyForecast from '@/components/weather/DailyForecast';
import TemperatureChart from '@/components/weather/TemperatureChart';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

interface CityPageClientProps {
  weather: WeatherData;
}

export default function CityPageClient({ weather }: CityPageClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <a href="/" className="hover:text-blue-500">Home</a>
          <span>/</span>
          <a href="/previsioni" className="hover:text-blue-500">Previsioni</a>
          <span>/</span>
          <span className="text-slate-800 dark:text-white font-medium">{weather.city.displayName}</span>
        </nav>

        <CurrentWeather weather={weather} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <HourlyForecast hourly={weather.hourly} />
          <TemperatureChart hourly={weather.hourly} />
        </div>
        
        <DailyForecast daily={weather.daily} />
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
            Mappa {weather.city.displayName}
          </h2>
          <WeatherMap 
            cities={[{
              ...weather.city,
              temperature: Math.round(weather.current.temperature),
              condition: 'clear',
            }]}
            center={[weather.city.lat, weather.city.lon]}
            zoom={11}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}