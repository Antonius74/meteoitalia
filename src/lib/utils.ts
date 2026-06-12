import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  // WMO Weather interpretation codes
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'partly-cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Cielo sereno',
    1: 'Prevalentemente sereno',
    2: 'Parzialmente nuvoloso',
    3: 'Nuvoloso',
    45: 'Nebbia',
    48: 'Nebbia con brina',
    51: 'Pioggerella leggera',
    53: 'Pioggerella moderata',
    55: 'Pioggerella intensa',
    61: 'Pioggia leggera',
    63: 'Pioggia moderata',
    65: 'Pioggia intensa',
    71: 'Nevicate leggere',
    73: 'Nevicate moderate',
    75: 'Nevicate intense',
    77: 'Granelli di neve',
    80: 'Rovesci leggeri',
    81: 'Rovesci moderati',
    82: 'Rovesci intensi',
    85: 'Nevicate leggere',
    86: 'Nevicate intense',
    95: 'Temporale',
    96: 'Temporale con grandine',
    99: 'Temporale con grandine',
  };
  return descriptions[code] || 'Nuvoloso';
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

import { ThemeColors } from '@/types/weather';