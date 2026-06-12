'use client';

import { useState, useCallback } from 'react';
import { WeatherData } from '@/types/weather';
import { weatherService } from '@/services/weather';
import { DEFAULT_CITY } from '@/lib/constants';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (city = DEFAULT_CITY) => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getWeatherByCity(city);
      setWeather(data);
    } catch (err: unknown) {
      setError('Errore nel caricamento dei dati meteorologici');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (weather) {
      void fetchWeather(weather.city);
    }
  }, [weather, fetchWeather]);

  return { weather, loading, error, refresh, fetchWeather };
}
