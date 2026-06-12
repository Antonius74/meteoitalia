'use client';

import { useState, useCallback, useRef } from 'react';
import { City } from '@/types/weather';
import { weatherService } from '@/services/weather';

export function useCitySearch() {
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(async () => {
      try {
        const cities = await weatherService.searchCities(query);
        setResults(cities);
      } catch (err) {
        setError('Errore nella ricerca');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = () => {
    setResults([]);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { results, loading, error, search, clear };
}