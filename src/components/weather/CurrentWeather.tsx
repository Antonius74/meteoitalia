'use client';

import { WeatherData } from '@/types/weather';
import { getWeatherCondition, getWeatherDescription, getThemeByWeather, formatTemperature } from '@/lib/utils';
import { Wind, Droplets, Eye, Gauge, Sun, Sunrise, Sunset, Thermometer } from 'lucide-react';

interface CurrentWeatherProps {
  weather: WeatherData;
}

export default function CurrentWeather({ weather }: CurrentWeatherProps) {
  const { current, city } = weather;
  const condition = getWeatherCondition(current.weatherCode);
  const description = getWeatherDescription(current.weatherCode);
  const theme = getThemeByWeather(current.weatherCode, current.isDay);

  const getWeatherIcon = (code: number, isDay: boolean) => {
    const condition = getWeatherCondition(code);
    const baseClass = "w-24 h-24 md:w-32 md:h-32";
    
    if (condition === 'clear' && isDay) {
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="4" fill="#FCD34D" stroke="#F59E0B" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="#F59E0B" strokeLinecap="round" />
        </svg>
      );
    }
    
    if (condition === 'rain') {
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.832A4.5 4.5 0 009.668 8H7.5a4.5 4.5 0 000 9h.3" stroke="#60A5FA" fill="rgba(96,165,250,0.2)" />
          <path d="M8 18v2M12 18v2M16 18v2" stroke="#60A5FA" strokeLinecap="round" />
        </svg>
      );
    }

    if (condition === 'cloudy' || condition === 'partly-cloudy') {
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19c.83 0 1.59-.34 2.12-.88.53-.53.88-1.29.88-2.12a3 3 0 00-3-3h-1a4.5 4.5 0 00-9 0h-1a3 3 0 00-3 3c0 .83.34 1.59.88 2.12.53.54 1.29.88 2.12.88h11.5z" fill="rgba(209,213,219,0.5)" stroke="#9CA3AF" />
          {isDay && (
            <circle cx="18" cy="6" r="3" fill="#FCD34D" stroke="#F59E0B" />
          )}
        </svg>
      );
    }

    if (condition === 'snow') {
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" stroke="white" fill="rgba(255,255,255,0.3)" />
          <path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" stroke="white" strokeLinecap="round" />
        </svg>
      );
    }

    // Default: partly cloudy
    return (
      <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17.5 19c.83 0 1.59-.34 2.12-.88.53-.53.88-1.29.88-2.12a3 3 0 00-3-3h-1a4.5 4.5 0 00-9 0h-1a3 3 0 00-3 3c0 .83.34 1.59.88 2.12.53.54 1.29.88 2.12.88h11.5z" fill="rgba(209,213,219,0.5)" stroke="#9CA3AF" />
      </svg>
    );
  };

  return (
    <div className={`${theme.bg} rounded-3xl p-6 md:p-8 text-white transition-all duration-500`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Info città e temperatura */}
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{city.displayName}</h1>
          <p className="text-white/80 text-lg mb-4">{city.region}</p>
          
          <div className="flex items-start gap-2">
            <span className="text-6xl md:text-7xl font-bold">
              {formatTemperature(current.temperature)}
            </span>
            <div className="mt-2">
              <p className="text-xl md:text-2xl font-medium">{description}</p>
              <p className="text-white/70">
                Percepita {formatTemperature(current.feelsLike)}
              </p>
            </div>
          </div>
        </div>

        {/* Icona meteo */}
        <div className="flex justify-center md:justify-end">
          {getWeatherIcon(current.weatherCode, current.isDay)}
        </div>
      </div>

      {/* Dettagli */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 ${theme.border} border-t`}>
        <DetailItem icon=<Wind className="w-5 h-5" /> label="Vento" value={`${Math.round(current.windSpeed)} km/h`} />
        <DetailItem icon=<Droplets className="w-5 h-5" /> label="Umidità" value={`${current.humidity}%`} />
        <DetailItem icon=<Gauge className="w-5 h-5" /> label="Pressione" value={`${Math.round(current.pressure)} hPa`} />
        <DetailItem icon=<Eye className="w-5 h-5" /> label="Visibilità" value={`${(current.visibility / 1000).toFixed(1)} km`} />
        <DetailItem icon=<Thermometer className="w-5 h-5" /> label="Precipitazioni" value={`${current.precipitation} mm`} />
        <DetailItem icon=<Sun className="w-5 h-5" /> label="Indice UV" value={`${Math.round(current.uvIndex)}`} />
        <DetailItem icon=<Sunrise className="w-5 h-5" /> label="Alba" value={new Date(current.sunrise).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})} />
        <DetailItem icon=<Sunset className="w-5 h-5" /> label="Tramonto" value={new Date(current.sunset).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})} />
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-white/70">{icon}</div>
      <div>
        <p className="text-xs text-white/60">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}