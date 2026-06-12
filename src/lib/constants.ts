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

export const WEATHER_CODES: Record<number, string> = {
  0: 'Sereno',
  1: 'Prevalentemente sereno',
  2: 'Parzialmente nuvoloso',
  3: 'Nuvoloso',
  45: 'Nebbia',
  48: 'Nebbia',
  51: 'Pioggerella',
  53: 'Pioggerella',
  55: 'Pioggerella',
  61: 'Pioggia',
  63: 'Pioggia',
  65: 'Pioggia',
  71: 'Neve',
  73: 'Neve',
  75: 'Neve',
  77: 'Neve',
  80: 'Rovesci',
  81: 'Rovesci',
  82: 'Rovesci',
  85: 'Nevicate',
  86: 'Nevicate',
  95: 'Temporale',
  96: 'Temporale',
  99: 'Temporale',
};