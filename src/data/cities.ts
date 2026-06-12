import { POPULAR_CITY_COORDS, POPULAR_CITIES } from '@/lib/constants';
import { City } from '@/types/weather';

export function getPopularCityList(): City[] {
  return POPULAR_CITIES.map((c) => {
    const coords = POPULAR_CITY_COORDS[c.name];
    return {
      name: c.name,
      displayName: c.displayName,
      region: c.region,
      lat: coords?.lat ?? 41.9,
      lon: coords?.lon ?? 12.5,
    };
  });
}

export type WorldCity = Pick<City, 'name' | 'displayName' | 'region'> & {
  lat: number;
  lon: number;
};

export const WORLD_CITIES: WorldCity[] = [
  { name: 'washington', displayName: 'Washington', region: 'Stati Uniti', lat: 38.89511, lon: -77.03637 },
  { name: 'new-york', displayName: 'New York', region: 'Stati Uniti', lat: 40.7128, lon: -74.006 },
  { name: 'los-angeles', displayName: 'Los Angeles', region: 'Stati Uniti', lat: 34.0522, lon: -118.2437 },
  { name: 'chicago', displayName: 'Chicago', region: 'Stati Uniti', lat: 41.8781, lon: -87.6298 },
  { name: 'miami', displayName: 'Miami', region: 'Stati Uniti', lat: 25.7617, lon: -80.1918 },
  { name: 'san-francisco', displayName: 'San Francisco', region: 'Stati Uniti', lat: 37.7749, lon: -122.4194 },
  { name: 'toronto', displayName: 'Toronto', region: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'vancouver', displayName: 'Vancouver', region: 'Canada', lat: 49.2827, lon: -123.1207 },
  { name: 'montreal', displayName: 'Montreal', region: 'Canada', lat: 45.5017, lon: -73.5673 },
  { name: 'citta-del-messico', displayName: 'Città del Messico', region: 'Messico', lat: 19.4326, lon: -99.1332 },
  { name: 'londra', displayName: 'Londra', region: 'Regno Unito', lat: 51.5074, lon: -0.1278 },
  { name: 'parigi', displayName: 'Parigi', region: 'Francia', lat: 48.8566, lon: 2.3522 },
  { name: 'berlino', displayName: 'Berlino', region: 'Germania', lat: 52.52, lon: 13.405 },
  { name: 'madrid', displayName: 'Madrid', region: 'Spagna', lat: 40.4168, lon: -3.7038 },
  { name: 'barcellona', displayName: 'Barcellona', region: 'Spagna', lat: 41.3851, lon: 2.1734 },
  { name: 'roma', displayName: 'Roma', region: 'Italia', lat: 41.9028, lon: 12.4964 },
  { name: 'milano', displayName: 'Milano', region: 'Italia', lat: 45.4642, lon: 9.19 },
  { name: 'napoli', displayName: 'Napoli', region: 'Italia', lat: 40.8518, lon: 14.2681 },
  { name: 'amsterdam', displayName: 'Amsterdam', region: 'Paesi Bassi', lat: 52.3676, lon: 4.9041 },
  { name: 'vienna', displayName: 'Vienna', region: 'Austria', lat: 48.2082, lon: 16.3738 },
  { name: 'zurigo', displayName: 'Zurigo', region: 'Svizzera', lat: 47.3769, lon: 8.5417 },
  { name: 'praga', displayName: 'Praga', region: 'Repubblica Ceca', lat: 50.0755, lon: 14.4378 },
  { name: 'budapest', displayName: 'Budapest', region: 'Ungheria', lat: 47.4979, lon: 19.0402 },
  { name: 'varsavia', displayName: 'Varsavia', region: 'Polonia', lat: 52.2297, lon: 21.0122 },
  { name: 'atene', displayName: 'Atene', region: 'Grecia', lat: 37.9838, lon: 23.7275 },
  { name: 'lisbona', displayName: 'Lisbona', region: 'Portogallo', lat: 38.7223, lon: -9.1393 },
  { name: 'copenaghen', displayName: 'Copenaghen', region: 'Danimarca', lat: 55.6761, lon: 12.5683 },
  { name: 'stoccolma', displayName: 'Stoccolma', region: 'Svezia', lat: 59.3293, lon: 18.0686 },
  { name: 'oslo', displayName: 'Oslo', region: 'Norvegia', lat: 59.9139, lon: 10.7522 },
  { name: 'helsinki', displayName: 'Helsinki', region: 'Finlandia', lat: 60.1699, lon: 24.9384 },
  { name: 'dublino', displayName: 'Dublino', region: 'Irlanda', lat: 53.3498, lon: -6.2603 },
  { name: 'bruxelles', displayName: 'Bruxelles', region: 'Belgio', lat: 50.8503, lon: 4.3517 },
  { name: 'mosca', displayName: 'Mosca', region: 'Russia', lat: 55.7558, lon: 37.6173 },
  { name: 'istanbul', displayName: 'Istanbul', region: 'Turchia', lat: 41.0082, lon: 28.9784 },
  { name: 'tokyo', displayName: 'Tokyo', region: 'Giappone', lat: 35.6762, lon: 139.6503 },
  { name: 'osaka', displayName: 'Osaka', region: 'Giappone', lat: 34.6937, lon: 135.5023 },
  { name: 'seul', displayName: 'Seul', region: 'Corea del Sud', lat: 37.5665, lon: 126.978 },
  { name: 'pechino', displayName: 'Pechino', region: 'Cina', lat: 39.9042, lon: 116.4074 },
  { name: 'shanghai', displayName: 'Shanghai', region: 'Cina', lat: 31.2304, lon: 121.4737 },
  { name: 'hong-kong', displayName: 'Hong Kong', region: 'Cina', lat: 22.3193, lon: 114.1694 },
  { name: 'bangkok', displayName: 'Bangkok', region: 'Thailandia', lat: 13.7563, lon: 100.5018 },
  { name: 'singapore', displayName: 'Singapore', region: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'mumbai', displayName: 'Mumbai', region: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'nuova-delhi', displayName: 'Nuova Delhi', region: 'India', lat: 28.6139, lon: 77.209 },
  { name: 'il-cairo', displayName: 'Il Cairo', region: 'Egitto', lat: 30.0444, lon: 31.2357 },
  { name: 'citta-del-capo', displayName: 'Città del Capo', region: 'Sudafrica', lat: -33.9249, lon: 18.4241 },
  { name: 'sydney', displayName: 'Sydney', region: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'melbourne', displayName: 'Melbourne', region: 'Australia', lat: -37.8136, lon: 144.9631 },
  { name: 'auckland', displayName: 'Auckland', region: 'Nuova Zelanda', lat: -36.8485, lon: 174.7633 },
  { name: 'dubai', displayName: 'Dubai', region: 'Emirati Arabi Uniti', lat: 25.2048, lon: 55.2708 },
  { name: 'rio-de-janeiro', displayName: 'Rio de Janeiro', region: 'Brasile', lat: -22.9068, lon: -43.1729 },
  { name: 'san-paolo', displayName: 'San Paolo', region: 'Brasile', lat: -23.5505, lon: -46.6333 },
  { name: 'buenos-aires', displayName: 'Buenos Aires', region: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { name: 'woking', displayName: 'Woking', region: 'Regno Unito', lat: 51.3168, lon: -0.5604 },
  { name: 'manchester', displayName: 'Manchester', region: 'Regno Unito', lat: 53.4808, lon: -2.2426 },
  { name: 'edimburgo', displayName: 'Edimburgo', region: 'Regno Unito', lat: 55.9533, lon: -3.1883 },
  { name: 'liverpool', displayName: 'Liverpool', region: 'Regno Unito', lat: 53.4084, lon: -2.9916 },
  { name: 'birmingham', displayName: 'Birmingham', region: 'Regno Unito', lat: 52.4862, lon: -1.8904 },
  { name: 'glasgow', displayName: 'Glasgow', region: 'Regno Unito', lat: 55.8642, lon: -4.2518 },
  { name: 'belfast', displayName: 'Belfast', region: 'Regno Unito', lat: 54.5973, lon: -5.9301 },
  { name: 'cardiff', displayName: 'Cardiff', region: 'Regno Unito', lat: 51.4816, lon: -3.1791 },
  { name: 'brighton', displayName: 'Brighton', region: 'Regno Unito', lat: 50.8225, lon: -0.1372 },
  { name: 'oxford', displayName: 'Oxford', region: 'Regno Unito', lat: 51.752, lon: -1.2577 },
  { name: 'cambridge', displayName: 'Cambridge', region: 'Regno Unito', lat: 52.2053, lon: 0.1218 },
  { name: 'bath', displayName: 'Bath', region: 'Regno Unito', lat: 51.3811, lon: -2.3597 },
  { name: 'york', displayName: 'York', region: 'Regno Unito', lat: 53.96, lon: -1.0873 },
  { name: 'birmingham-us', displayName: 'Birmingham (US)', region: 'Stati Uniti', lat: 33.5186, lon: -86.8104 },
  { name: 'boston', displayName: 'Boston', region: 'Stati Uniti', lat: 42.3601, lon: -71.0589 },
  { name: 'dallas', displayName: 'Dallas', region: 'Stati Uniti', lat: 32.7767, lon: -96.797 },
  { name: 'houston', displayName: 'Houston', region: 'Stati Uniti', lat: 29.7604, lon: -95.3698 },
  { name: 'seattle', displayName: 'Seattle', region: 'Stati Uniti', lat: 47.6062, lon: -122.3321 },
  { name: 'denver', displayName: 'Denver', region: 'Stati Uniti', lat: 39.7392, lon: -104.9903 },
  { name: 'atlanta', displayName: 'Atlanta', region: 'Stati Uniti', lat: 33.749, lon: -84.388 },
  { name: 'philadelphia', displayName: 'Philadelphia', region: 'Stati Uniti', lat: 39.9526, lon: -75.1652 },
  { name: 'orlando', displayName: 'Orlando', region: 'Stati Uniti', lat: 28.5383, lon: -81.3792 },
  { name: 'las-vegas', displayName: 'Las Vegas', region: 'Stati Uniti', lat: 36.1699, lon: -115.1398 },
  { name: 'barcelona', displayName: 'Barcellona', region: 'Spagna', lat: 41.3851, lon: 2.1734 },
  { name: 'valencia', displayName: 'Valencia', region: 'Spagna', lat: 39.4699, lon: -0.3763 },
  { name: 'siviglia', displayName: 'Siviglia', region: 'Spagna', lat: 37.3886, lon: -5.9823 },
  { name: 'lione', displayName: 'Lione', region: 'Francia', lat: 45.764, lon: 4.8357 },
  { name: 'nizza', displayName: 'Nizza', region: 'Francia', lat: 43.7102, lon: 7.262 },
  { name: 'marsiglia', displayName: 'Marsiglia', region: 'Francia', lat: 43.2965, lon: 5.3698 },
  { name: 'monaco', displayName: 'Monaco di Baviera', region: 'Germania', lat: 48.1351, lon: 11.582 },
  { name: 'amburgo', displayName: 'Amburgo', region: 'Germania', lat: 53.5511, lon: 9.9937 },
  { name: 'francoforte', displayName: 'Francoforte', region: 'Germania', lat: 50.1109, lon: 8.6821 },
  { name: 'stoccolma', displayName: 'Stoccolma', region: 'Svezia', lat: 59.3293, lon: 18.0686 },
  { name: 'oslo', displayName: 'Oslo', region: 'Norvegia', lat: 59.9139, lon: 10.7522 },
  { name: 'copenaghen', displayName: 'Copenaghen', region: 'Danimarca', lat: 55.6761, lon: 12.5683 },
  { name: 'reikiavik', displayName: 'Reykjavík', region: 'Islanda', lat: 64.1466, lon: -21.9426 },
  { name: 'mosca', displayName: 'Mosca', region: 'Russia', lat: 55.7558, lon: 37.6173 },
  { name: 'istanbul', displayName: 'Istanbul', region: 'Turchia', lat: 41.0082, lon: 28.9784 },
  { name: 'atene', displayName: 'Atene', region: 'Grecia', lat: 37.9838, lon: 23.7275 },
  { name: 'bangkok', displayName: 'Bangkok', region: 'Thailandia', lat: 13.7563, lon: 100.5018 },
  { name: 'singapore', displayName: 'Singapore', region: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'mumbai', displayName: 'Mumbai', region: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'pechino', displayName: 'Pechino', region: 'Cina', lat: 39.9042, lon: 116.4074 },
  { name: 'shanghai', displayName: 'Shanghai', region: 'Cina', lat: 31.2304, lon: 121.4737 },
  { name: 'hong-kong', displayName: 'Hong Kong', region: 'Cina', lat: 22.3193, lon: 114.1694 },
  { name: 'seul', displayName: 'Seul', region: 'Corea del Sud', lat: 37.5665, lon: 126.978 },
  { name: 'il-cairo', displayName: 'Il Cairo', region: 'Egitto', lat: 30.0444, lon: 31.2357 },
  { name: 'citta-del-capo', displayName: 'Città del Capo', region: 'Sudafrica', lat: -33.9249, lon: 18.4241 },
  { name: 'melbourne', displayName: 'Melbourne', region: 'Australia', lat: -37.8136, lon: 144.9631 },
  { name: 'auckland', displayName: 'Auckland', region: 'Nuova Zelanda', lat: -36.8485, lon: 174.7633 },
  { name: 'san-paolo', displayName: 'San Paolo', region: 'Brasile', lat: -23.5505, lon: -46.6333 },
  { name: 'lima', displayName: 'Lima', region: 'Perù', lat: -12.0464, lon: -77.0428 },
  { name: 'santiago', displayName: 'Santiago del Cile', region: 'Cile', lat: -33.4489, lon: -70.6693 },
  { name: 'bogota', displayName: 'Bogotà', region: 'Colombia', lat: 4.711, lon: -74.0721 },
  { name: 'citta-del-messico', displayName: 'Città del Messico', region: 'Messico', lat: 19.4326, lon: -99.1332 },
  { name: 'osaka', displayName: 'Osaka', region: 'Giappone', lat: 34.6937, lon: 135.5023 },
];

export const ALL_CITIES_BY_SLUG: Record<string, WorldCity> = (() => {
  const map: Record<string, WorldCity> = {};
  for (const c of WORLD_CITIES) {
    map[c.name] = c;
  }
  return map;
})();

export function findCityBySlug(slug: string): City | null {
  const local = ALL_CITIES_BY_SLUG[slug];
  if (local) {
    return { ...local };
  }
  const it = POPULAR_CITY_COORDS[slug];
  if (it) {
    const meta = POPULAR_CITIES.find((c) => c.name === slug);
    if (meta) {
      return {
        name: meta.name,
        displayName: meta.displayName,
        region: meta.region,
        lat: it.lat,
        lon: it.lon,
      };
    }
  }
  return null;
}
