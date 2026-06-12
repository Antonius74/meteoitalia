'use client';

import Link from 'next/link';
import { HourlyForecast } from '@/types/weather';
import { getWeatherDescription, formatTemperature, getHourFromIso } from '@/lib/utils';
import { getWeatherEmoji } from '@/lib/icons';

interface HourlyForecastProps {
  hourly: HourlyForecast[];
  citySlug?: string;
  date?: string;
}

export default function HourlyForecastComponent({
  hourly,
  citySlug,
  date,
}: HourlyForecastProps) {
  const showNav = Boolean(citySlug && date);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Previsioni orarie</h2>
        {showNav && <span className="text-xs text-slate-500">Clicca un&apos;ora per i dettagli</span>}
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          {hourly.map((hour, index) => {
            const hourId = `ora-${hour.time.split('T')[1]?.split(':')[0] ?? index}`;
            const isFirst = index === 0;

            const content = (
              <>
                <span className="text-sm font-medium">
                  {isFirst && !showNav ? 'Ora' : getHourFromIso(hour.time)}
                </span>
                <span
                  className="text-2xl"
                  role="img"
                  aria-label={getWeatherDescription(hour.weatherCode)}
                >
                  {getWeatherEmoji(hour.weatherCode)}
                </span>
                <span className="text-lg font-bold">{formatTemperature(hour.temperature)}</span>
                <span className="text-xs opacity-80">{hour.precipitationProbability}%</span>
                <span className="text-[10px] opacity-60 mt-1">
                  💧 {hour.humidity}% · 💨 {Math.round(hour.windSpeed)}
                </span>
              </>
            );

            const baseClass = `flex flex-col items-center gap-1 p-3 rounded-xl min-w-[80px] transition-all ${
              isFirst
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`;

            if (showNav && citySlug && date) {
              return (
                <Link
                  key={hour.time}
                  href={`/citta/${citySlug}/giorno/${date}#${hourId}`}
                  id={hourId}
                  className={`${baseClass} hover:scale-105 cursor-pointer scroll-mt-24`}
                  aria-label={`Dettagli ore ${getHourFromIso(hour.time)}: ${formatTemperature(hour.temperature)}, ${getWeatherDescription(hour.weatherCode)}, umidità ${hour.humidity}%`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={hour.time} className={baseClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
