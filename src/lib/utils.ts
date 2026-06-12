import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ThemeColors } from '@/types/weather';
import { WEATHER_CODES } from './weatherCodes';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°`;
}

export function formatWindSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatPressure(pressure: number): string {
  return `${Math.round(pressure)} hPa`;
}

export function formatVisibility(visibility: number): string {
  return `${(visibility / 1000).toFixed(1)} km`;
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { weekday: 'short' });
}

export function getShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function getHourFromIso(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function getWeatherCondition(code: number): string {
  return WEATHER_CODES[code]?.condition ?? 'cloudy';
}

export function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code]?.description ?? 'Nuvoloso';
}

export function getThemeByWeather(code: number, isDay: boolean): ThemeColors {
  const condition = getWeatherCondition(code);
  
  if (!isDay) {
    return {
      bg: 'bg-slate-900',
      card: 'bg-slate-800/80',
      text: 'text-white',
      accent: 'text-blue-300',
      border: 'border-slate-700',
    };
  }

  const themes: Record<string, ThemeColors> = {
    clear: {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      card: 'bg-white/20 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-yellow-300',
      border: 'border-white/30',
    },
    'partly-cloudy': {
      bg: 'bg-gradient-to-br from-blue-300 to-blue-500',
      card: 'bg-white/20 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-yellow-200',
      border: 'border-white/30',
    },
    cloudy: {
      bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
      card: 'bg-white/15 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-blue-200',
      border: 'border-white/20',
    },
    rain: {
      bg: 'bg-gradient-to-br from-slate-600 to-slate-800',
      card: 'bg-white/10 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-blue-300',
      border: 'border-white/20',
    },
    snow: {
      bg: 'bg-gradient-to-br from-slate-200 to-slate-400',
      card: 'bg-white/30 backdrop-blur-md',
      text: 'text-slate-800',
      accent: 'text-blue-500',
      border: 'border-white/40',
    },
    thunderstorm: {
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
      card: 'bg-white/10 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-yellow-400',
      border: 'border-white/20',
    },
    fog: {
      bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
      card: 'bg-white/20 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-gray-200',
      border: 'border-white/30',
    },
    drizzle: {
      bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
      card: 'bg-white/15 backdrop-blur-md',
      text: 'text-white',
      accent: 'text-blue-300',
      border: 'border-white/20',
    },
  };

  return themes[condition] || themes.clear;
}