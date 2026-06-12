'use client';

import { useState, useEffect, useCallback } from 'react';

export function useGeolocation(autoFetch = false) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La geolocalizzazione non è supportata dal browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      (err: GeolocationPositionError) => {
        setError('Impossibile ottenere la posizione');
        setLoading(false);
        console.error(err);
      },
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getLocation();
    }
  }, [autoFetch, getLocation]);

  return { location, loading, error, getLocation };
}
