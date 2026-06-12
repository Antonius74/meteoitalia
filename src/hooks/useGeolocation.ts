'use client';

import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
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
      (err) => {
        setError('Impossibile ottenere la posizione');
        setLoading(false);
        console.error(err);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { location, loading, error, getLocation };
}