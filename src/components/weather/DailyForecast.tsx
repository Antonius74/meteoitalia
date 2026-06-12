'use client';

import Link from 'next/link';
import { ChevronRight, Droplets } from 'lucide-react';
import { DailyForecast } from '@/types/weather';
import { getWeatherDescription, formatTemperature } from '@/lib/utils';
import { getWeatherEmoji } from '@/lib/icons';

interface DailyForecastProps {
  daily: DailyForecast[];
  citySlug: string;
}

export default function DailyForecastComponent({ daily, citySlug }: DailyForecastProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Previsioni 7 giorni</h2>
        <span className="text-xs text-slate-500">Clicca per le 24h</span>
      </div>

      <ul className="space-y-2" role="list">
        {daily.map((day) => {
          const isToday = day.date === today;
          return (
            <li key={day.date}>
              <Link
                href={`/citta/${citySlug}/giorno/${day.date}`}
                className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                }`}
                aria-label={`Vedi previsioni orarie di ${isToday ? 'oggi' : day.dayOfWeek} ${formatTemperature(day.maxTemp)} ${formatTemperature(day.minTemp)}`}
              >
                <div className="flex items-center gap-3 w-28">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isToday ? 'Oggi' : day.dayOfWeek}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <span
                    className="text-2xl"
                    role="img"
                    aria-label={getWeatherDescription(day.weatherCode)}
                  >
                    {getWeatherEmoji(day.weatherCode)}
                  </span>
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
                  <span className="text-sm text-slate-400">{formatTemperature(day.minTemp)}</span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all ml-2" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
