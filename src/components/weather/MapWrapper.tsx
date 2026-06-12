'use client';

import dynamic from 'next/dynamic';
import { MapCity } from '@/types/weather';

const WeatherMap = dynamic(() => import('@/components/weather/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[500px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
      role="status"
    >
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});

export default function MapWrapper({
  cities,
  center,
  zoom,
}: {
  cities: MapCity[];
  center: [number, number];
  zoom: number;
}) {
  return <WeatherMap cities={cities} center={center} zoom={zoom} />;
}
