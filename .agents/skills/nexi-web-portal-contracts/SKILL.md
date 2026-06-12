# Nexi Web Portal Contracts

Contratti condivisi per portali web con stack Node.js/Next.js.

## API Contracts

### Weather API Response Format

```typescript
interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    visibility: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    precipitation_probability: number[];
    visibility: number[];
  };
}
```

### Geo API Response Format

```typescript
interface GeoApiResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code: string;
    country_code: string;
    admin1_id: number;
    admin1: string;
    timezone: string;
    population?: number;
  }>;
}
```

## Error Contracts

### Service Error Format

```typescript
interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
}
```

## Component Contracts

### Weather Component Props

```typescript
interface WeatherComponentProps {
  weather: WeatherData;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

interface MapComponentProps {
  cities: Array<City & { temperature?: number; condition?: string }>;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (city: City) => void;
}
```

## Style Contracts

### Theme Colors

```typescript
interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  accent: string;
  border: string;
}
```

### Breakpoints

| Name | Value | Use Case |
|------|-------|----------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

## Related

- [Provider](nexi-web-portal-provider/SKILL.md)
- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
