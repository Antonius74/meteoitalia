'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayerGroup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix per le icone di Leaflet in Next.js
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export interface MapCity {
  name: string;
  displayName: string;
  region?: string;
  lat: number;
  lon: number;
  temperature?: number;
  condition?: string;
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  humidity?: number;
  precipitation?: number;
}

interface WeatherMapProps {
  cities: MapCity[];
  center?: [number, number];
  zoom?: number;
  activeLayer?: 'temp' | 'wind' | 'rain' | 'pressure' | 'satellite';
}

// Timestamp RainViewer arrotondato ai 10 minuti
function getRainViewerTimestamp(): number {
  const now = new Date();
  const ms = now.getTime();
  const roundMs = Math.floor(ms / 600000) * 600000;
  return Math.floor(roundMs / 1000);
}

// Icona temperatura
function tempIcon(city: MapCity) {
  const temp = city.temperature ?? 20;
  const color = temp < 10 ? '#3B82F6' : temp < 20 ? '#10B981' : temp < 28 ? '#F59E0B' : '#EF4444';
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        min-width: 36px; height: 36px; border-radius: 50%;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; color: white; font-size: 13px; font-family: sans-serif;
        padding: 0 6px;
      ">${Math.round(temp)}°</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Icona vento con freccia direzionale
function windIcon(city: MapCity) {
  const speed = city.windSpeed ?? 0;
  const dir = city.windDirection ?? 0;
  const color = speed < 20 ? '#10B981' : speed < 40 ? '#F59E0B' : speed < 60 ? '#EF4444' : '#7C3AED';
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:2px;
      ">
        <div style="
          width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;
          border-bottom:16px solid ${color};transform:rotate(${dir}deg);filter:drop-shadow(0 2px 2px rgba(0,0,0,0.3));
        "></div>
        <div style="
          background:${color};color:white;border-radius:4px;padding:1px 4px;
          font-size:11px;font-weight:bold;font-family:sans-serif;white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
        ">${Math.round(speed)} km/h</div>
      </div>
    `,
    iconSize: [60, 50],
    iconAnchor: [30, 25],
  });
}

// Icona pressione
function pressureIcon(city: MapCity) {
  const p = city.pressure ?? 1013;
  const color = p < 1000 ? '#EF4444' : p < 1010 ? '#F59E0B' : p < 1020 ? '#10B981' : '#3B82F6';
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        min-width: 48px; height: 32px; border-radius: 8px;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; color: white; font-size: 12px; font-family: sans-serif;
        padding: 0 6px;
      ">${Math.round(p)} hPa</div>
    `,
    iconSize: [48, 32],
    iconAnchor: [24, 16],
  });
}

// Icona precipitazioni
function rainIcon(city: MapCity) {
  const rain = city.precipitation ?? 0;
  const color = rain === 0 ? '#9CA3AF' : rain < 2 ? '#60A5FA' : rain < 5 ? '#3B82F6' : rain < 10 ? '#1D4ED8' : '#1E3A8A';
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        min-width: 40px; height: 36px; border-radius: 50%;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; color: white; font-size: 13px; font-family: sans-serif;
        padding: 0 6px;
      ">${rain.toFixed(1)}mm</div>
    `,
    iconSize: [40, 36],
    iconAnchor: [20, 18],
  });
}

function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function WeatherMap({ cities, center = [41.9, 12.5], zoom = 6, activeLayer = 'temp' }: WeatherMapProps) {
  const [rainTs, setRainTs] = useState(getRainViewerTimestamp());

  // Aggiorna timestamp RainViewer ogni 5 minuti
  useEffect(() => {
    const interval = setInterval(() => setRainTs(getRainViewerTimestamp()), 300000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (city: MapCity) => {
    switch (activeLayer) {
      case 'wind': return windIcon(city);
      case 'pressure': return pressureIcon(city);
      case 'rain': return rainIcon(city);
      case 'satellite': return tempIcon(city); // fallback
      default: return tempIcon(city);
    }
  };

  const getPopupContent = (city: MapCity) => {
    return (
      <div className="text-center min-w-[120px]">
        <p className="font-bold text-slate-800">{city.displayName}</p>
        {city.region && <p className="text-xs text-slate-500">{city.region}</p>}
        <div className="mt-2 space-y-1 text-sm">
          {city.temperature !== undefined && (
            <p>🌡️ {Math.round(city.temperature)}°C</p>
          )}
          {city.windSpeed !== undefined && activeLayer === 'wind' && (
            <p>💨 {Math.round(city.windSpeed)} km/h</p>
          )}
          {city.windDirection !== undefined && activeLayer === 'wind' && (
            <p>🧭 {Math.round(city.windDirection)}°</p>
          )}
          {city.pressure !== undefined && activeLayer === 'pressure' && (
            <p>📊 {Math.round(city.pressure)} hPa</p>
          )}
          {city.humidity !== undefined && (
            <p>💧 Umidità: {city.humidity}%</p>
          )}
          {city.precipitation !== undefined && activeLayer === 'rain' && (
            <p>🌧️ Precipitazioni: {city.precipitation} mm</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[500px] w-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater center={center} />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={activeLayer !== 'satellite'} name="Mappa">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked={activeLayer === 'satellite'} name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Overlay RainViewer quando layer = rain */}
        {activeLayer === 'rain' && (
          <TileLayer
            attribution='&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
            url={`https://tilecache.rainviewer.com/v2/radar/${rainTs}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.6}
            key={`rain-${rainTs}`}
          />
        )}

        {/* Overlay nuvole quando layer = satellite (NASA GIBS) */}
        {activeLayer === 'satellite' && (
          <TileLayer
            attribution='NASA GIBS'
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Top_Pressure_Day/default/{time}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png"
            opacity={0.4}
          />
        )}

        {cities.map((city, index) => (
          <Marker
            key={`${city.name}-${activeLayer}`}
            position={[city.lat, city.lon]}
            icon={getIcon(city)}
          >
            <Popup>{getPopupContent(city)}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
