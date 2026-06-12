# Meteo Map Kit

Utility skill per integrazione mappe interattive nel portale meteo.

## Scopo

Fornisce pattern standardizzati per:
- Mappe meteorologiche interattive con Leaflet
- Marker personalizzati per condizioni meteo
- Integrazione radar e satellite
- Mappe di previsioni

## Map Component Pattern

```typescript
// components/maps/WeatherMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const weatherIcon = (condition: string) => {
  const colors: Record<string, string> = {
    'clear': '#FCD34D',
    'partly-cloudy': '#FCD34D',
    'cloudy': '#9CA3AF',
    'rain': '#60A5FA',
    'snow': '#FFFFFF',
    'thunderstorm': '#F59E0B',
    'fog': '#D1D5DB',
    'drizzle': '#93C5FD',
  };
  
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `<div style="
      width: 30px; height: 30px; border-radius: 50%;
      background: ${colors[condition] || colors.clear};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; color: ${condition === 'snow' ? '#1E293B' : 'white'};
      font-size: 11px;
    ">☀</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

interface WeatherMapProps {
  cities: Array<City & { temperature?: number; condition?: string }>;
  center?: [number, number];
  zoom?: number;
}

export default function WeatherMap({ cities, center = [41.9, 12.5], zoom = 6 }: WeatherMapProps) {
  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cities.map((city, index) => (
          <Marker key={index} position={[city.lat, city.lon]} icon={weatherIcon(city.condition || 'clear')}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">{city.displayName}</p>
                {city.temperature && <p className="text-lg">{city.temperature}°C</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

## Dynamic Import Pattern

```typescript
// Avoid SSR issues with Leaflet
const WeatherMap = dynamic(() => import('./WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Caricamento mappa...</span>
    </div>
  ),
});
```

## Radar Integration Pattern

```typescript
// components/maps/RadarMap.tsx
export function RadarMap() {
  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-lg">
      <iframe
        src="https://www.rainviewer.com/map.html?loc=41.9,12.5,5&oC=1&c=1&o=83,0.7,300&lm=1&lb=1&tr=1&ts=1&th=1&tm=1&sn=1&sl=1&p=1"
        className="w-full h-full border-0"
        title="Radar Precipitazioni"
        allowFullScreen
      />
    </div>
  );
}
```

## External Map Services

| Service | URL | Use Case |
|---------|-----|----------|
| RainViewer | `https://www.rainviewer.com` | Radar precipitazioni |
| Windy | `https://www.windy.com` | Mappe interattive vento/temp |
| OpenStreetMap | `https://tile.openstreetmap.org` | Base tiles |

## Leaflet Assets

Copiare icone marker in `public/`:
```bash
cp node_modules/leaflet/dist/images/marker-icon.png public/
cp node_modules/leaflet/dist/images/marker-icon-2x.png public/
cp node_modules/leaflet/dist/images/marker-shadow.png public/
```

## Related

- [Weather Kit](meteo-weather-kit/SKILL.md)
- [SEO Kit](meteo-seo-kit/SKILL.md)
- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
