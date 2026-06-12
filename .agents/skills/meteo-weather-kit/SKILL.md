# Meteo Weather Kit

Utility skill per integrazione dati meteorologici nel portale.

## Scopo

Fornisce pattern standardizzati per:
- Fetching dati meteo da API esterne (Open-Meteo)
- Transformazione e normalizzazione dati
- Caching strategico
- Error handling e fallback

## Data Model

```typescript
// types/weather.ts
export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  pressure: number;
  feelsLike: number;
  uvIndex: number;
  visibility: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  visibility: number;
}

export interface City {
  name: string;
  displayName: string;
  region: string;
  lat: number;
  lon: number;
  population?: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  city: City;
  lastUpdated: string;
}
```

## Service Pattern

```typescript
// services/weather.ts
import { WeatherData, City } from '@/types/weather';

const API_BASE_URL = 'https://api.open-meteo.com/v1';
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1';

class WeatherService {
  private async fetchWithCache(url: string): Promise<any> {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 2) return [];
    const url = `${GEO_API_URL}/search?name=${encodeURIComponent(query)}&count=10&language=it&format=json`;
    const data = await this.fetchWithCache(url);
    return (data.results || []).map((result: any) => ({
      name: result.name.toLowerCase(),
      displayName: result.name,
      region: result.admin1 || '',
      lat: result.latitude,
      lon: result.longitude,
      population: result.population,
    }));
  }

  async getWeatherByCoordinates(lat: number, lon: number, city: City): Promise<WeatherData> {
    const url = `${API_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=Europe/Rome&forecast_days=7`;
    
    const data = await this.fetchWithCache(url);
    // Transform Open-Meteo format to WeatherData
    return this.transformWeatherData(data, city);
  }

  private transformWeatherData(data: any, city: City): WeatherData {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    return {
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
        pressure: current.surface_pressure,
        feelsLike: current.apparent_temperature,
        uvIndex: 0,
        visibility: current.visibility,
        precipitation: current.precipitation,
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0],
        isDay: current.is_day === 1,
      },
      daily: daily.time.map((date: string, index: number) => ({
        date,
        dayOfWeek: new Date(date).toLocaleDateString('it-IT', { weekday: 'short' }),
        maxTemp: daily.temperature_2m_max[index],
        minTemp: daily.temperature_2m_min[index],
        weatherCode: daily.weather_code[index],
        precipitationProbability: daily.precipitation_probability_max[index],
        windSpeed: daily.wind_speed_10m_max[index],
        sunrise: daily.sunrise[index],
        sunset: daily.sunset[index],
        uvIndexMax: daily.uv_index_max[index],
      })),
      hourly: hourly.time.slice(0, 24).map((time: string, index: number) => ({
        time,
        temperature: hourly.temperature_2m[index],
        weatherCode: hourly.weather_code[index],
        precipitationProbability: hourly.precipitation_probability[index],
        windSpeed: hourly.wind_speed_10m[index],
        humidity: hourly.relative_humidity_2m[index],
        visibility: hourly.visibility[index],
      })),
      city,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const weatherService = new WeatherService();
```

## Hook Pattern

```typescript
// hooks/useWeather.ts
'use client';

import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/weather';
import { weatherService } from '@/services/weather';
import { DEFAULT_CITY } from '@/lib/constants';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (city = DEFAULT_CITY) => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getWeatherByCity(city);
      setWeather(data);
    } catch (err) {
      setError('Errore nel caricamento dei dati meteorologici');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (weather) {
      fetchWeather(weather.city);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return { weather, loading, error, refresh, fetchWeather };
}
```

## Weather Code Mapping

```typescript
// lib/utils.ts - Weather helpers
export function getWeatherCondition(code: number): string {
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

export function getThemeByWeather(code: number, isDay: boolean) {
  // Returns theme colors based on weather condition
}
```

## Caching Strategy

- **ISR**: `revalidate: 300` (5 minuti) per dati meteo
- **Client cache**: SWR o React Query con stale-while-revalidate
- **Static generation**: Pagine città pre-renderizzate con `generateStaticParams`

## Error Handling

- Network errors: retry con exponential backoff
- API errors: fallback a dati cache se disponibili
- Missing data: placeholder UI con skeleton loaders

## Related

- [Map Kit](meteo-map-kit/SKILL.md)
- [SEO Kit](meteo-seo-kit/SKILL.md)
- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
