'use client';

import { HourlyForecast } from '@/types/weather';
import { getWeatherDescription, formatTemperature, getHourFromIso } from '@/lib/utils';

interface HourlyForecastProps {
  hourly: HourlyForecast[];
}

export default function HourlyForecastComponent({ hourly }: HourlyForecastProps) {
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Previsioni orarie</h2>
      
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {hourly.map((hour, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] ${
                index === 0 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span className="text-sm font-medium">
                {index === 0 ? 'Ora' : getHourFromIso(hour.time)}
              </span>
              <span className="text-2xl">{getWeatherIcon(hour.weatherCode)}</span>
              <span className="text-lg font-bold">{formatTemperature(hour.temperature)}</span>
              <span className="text-xs opacity-80">{hour.precipitationProbability}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}