export const API_BASE_URL = 'https://api.open-meteo.com/v1';
export const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1';

export const DEFAULT_CITY = {
  name: 'roma',
  displayName: 'Roma',
  region: 'Lazio',
  lat: 41.9028,
  lon: 12.4964,
};

export const POPULAR_CITIES = [
  { name: 'roma', displayName: 'Roma', region: 'Lazio' },
  { name: 'milano', displayName: 'Milano', region: 'Lombardia' },
  { name: 'napoli', displayName: 'Napoli', region: 'Campania' },
  { name: 'torino', displayName: 'Torino', region: 'Piemonte' },
  { name: 'palermo', displayName: 'Palermo', region: 'Sicilia' },
  { name: 'genova', displayName: 'Genova', region: 'Liguria' },
  { name: 'bologna', displayName: 'Bologna', region: 'Emilia-Romagna' },
  { name: 'firenze', displayName: 'Firenze', region: 'Toscana' },
  { name: 'bari', displayName: 'Bari', region: 'Puglia' },
  { name: 'catania', displayName: 'Catania', region: 'Sicilia' },
  { name: 'venezia', displayName: 'Venezia', region: 'Veneto' },
  { name: 'verona', displayName: 'Verona', region: 'Veneto' },
];

export const POPULAR_CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  roma: { lat: 41.9028, lon: 12.4964 },
  milano: { lat: 45.4642, lon: 9.19 },
  napoli: { lat: 40.8518, lon: 14.2681 },
  torino: { lat: 45.0703, lon: 7.6869 },
  palermo: { lat: 38.1157, lon: 13.3615 },
  genova: { lat: 44.4056, lon: 8.9463 },
  bologna: { lat: 44.4949, lon: 11.3426 },
  firenze: { lat: 43.7696, lon: 11.2558 },
  bari: { lat: 41.1171, lon: 16.8719 },
  catania: { lat: 37.5079, lon: 15.083 },
  venezia: { lat: 45.4408, lon: 12.3155 },
  verona: { lat: 45.4384, lon: 10.9916 },
};
