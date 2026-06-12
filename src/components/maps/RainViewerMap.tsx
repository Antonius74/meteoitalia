'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react';

L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
});

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

interface RainViewerTimestamp {
  past: number[];
  nowcast: number[];
}

interface RainViewerApiResponse {
  version: string;
  generated: number;
  host: string;
  radar: RainViewerTimestamp;
}

export default function RainViewerMap() {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestTimestamp = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!response.ok) throw new Error('RainViewer API non disponibile');
      const data: RainViewerApiResponse = await response.json();
      
      const allTimestamps = [...data.radar.past, ...data.radar.nowcast];
      const latest = allTimestamps[allTimestamps.length - 1];
      
      if (!latest) throw new Error('Nessun timestamp disponibile');
      setTimestamp(latest);
    } catch (err) {
      console.error('RainViewer API error:', err);
      setError('Impossibile caricare i dati radar da RainViewer');
      // Fallback: usa timestamp approssimativo recente
      const fallbackTs = Math.floor(Date.now() / 1000 / 600) * 600;
      setTimestamp(fallbackTs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestTimestamp();
  }, []);

  if (loading) {
    return (
      <div className="h-[600px] w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Caricamento dati radar...</p>
        </div>
      </div>
    );
  }

  if (!timestamp) {
    return (
      <div className="h-[600px] w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Radar non disponibile
          </h3>
          <p className="text-slate-500 mb-4 max-w-md">
            Impossibile ottenere i dati radar. Prova ad aggiornare o visita RainViewer direttamente.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchLatestTimestamp}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Riprova
            </button>
            <a
              href="https://www.rainviewer.com/it.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              RainViewer
            </a>
          </div>
        </div>
      </div>
    );
  }

  const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`;

  return (
    <div className="relative h-[600px] w-full rounded-b-2xl overflow-hidden">
      <MapContainer
        center={[41.9, 12.5]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater />
        
        {/* Base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Radar overlay */}
        <TileLayer
          attribution='&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
          url={radarUrl}
          opacity={0.65}
          key={`radar-${timestamp}`}
        />
      </MapContainer>

      {error && (
        <div className="absolute top-4 right-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2 z-[1000]">
          <AlertTriangle className="w-4 h-4" />
          Dati radar in fallback
        </div>
      )}
    </div>
  );
}
