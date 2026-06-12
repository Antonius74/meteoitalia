'use client';

import { DailyForecast } from '@/types/weather';
import { getWeatherDescription, formatTemperature } from '@/lib/utils';
import { Droplets, Wind } from 'lucide-react';

interface DailyForecastProps {
  daily: DailyForecast[];
}

export default function DailyForecastComponent({ daily }: DailyForecastProps) {
  const getWeatherIcon = (code: number) => {
    const condition = getWeatherDescription(code).toLowerCase();
    
    if (condition.includes('sereno')) return '☀️';
    if (condition.includes('nuvoloso')) return '☁️';
    if (condition.includes('pioggia')) return '🌧️';
    if (condition.includes('neve')) return '❄️';
    if (condition.includes('temporale')) return '⛈️';
    if (condition.includes('nebbia')) return '🌫️';
    return '🌤️';
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Previsioni 7 giorni</h2>
      
      <div className="space-y-3">
        {daily.map((day, index) => {
          const isToday = day.date === today;
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                isToday 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3 w-28">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isToday ? 'Oggi' : day.dayOfWeek}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">{getWeatherIcon(day.weatherCode)}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">
                  {getWeatherDescription(day.weatherCode)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-blue-500">
                <Droplets className="w-3 h-3" />
                <span>{day.precipitationProbability}%</span>
              </div>

              <div className="flex items-center gap-2 w-24 justify-end">
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {formatTemperature(day.maxTemp)}
                </span>
                <span className="text-sm text-slate-400">
                  {formatTemperature(day.minTemp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}