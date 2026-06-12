# Web Portal Frontend Runtime

Runtime variant per portali web con stack Node.js/Next.js.

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| Framework | Next.js | 16+ |
| Language | TypeScript | 5.7+ |
| Styling | Tailwind CSS | 4+ |
| UI Components | React | 19+ |
| Icons | Lucide React | latest |
| Charts | Recharts | latest |
| Maps | Leaflet / React-Leaflet | latest |
| HTTP Client | Fetch API / Axios | native |

## Convenzioni di Progetto

### Struttura Directory

```
portal/
├── src/
│   ├── app/                    # App Router Next.js
│   │   ├── api/               # API Routes
│   │   ├── [page]/            # Pagine dinamiche
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Stili globali
│   ├── components/
│   │   ├── layout/            # Header, Footer, Navigation
│   │   ├── features/          # Componenti feature-specific
│   │   └── shared/            # Componenti riutilizzabili
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API clients e business logic
│   ├── types/                 # TypeScript interfaces
│   ├── lib/                   # Utility functions
│   └── data/                  # Static data e constants
├── public/                    # Assets statici
├── docs/                      # Documentazione
├── .agents/skills/           # Skill installate
└── next.config.ts            # Configurazione Next.js
```

### Naming Conventions

- **Files**: lowercase, hyphen-separated (`weather-card.tsx`)
- **Components**: PascalCase (`WeatherCard.tsx`)
- **Hooks**: camelCase con prefisso `use` (`useWeather.ts`)
- **Services**: camelCase con suffisso `Service` (`weatherService.ts`)
- **Types**: PascalCase con suffisso opzionale (`WeatherData.ts`)

### Styling Pattern

Usare Tailwind CSS con approccio utility-first:
- Componenti layout con classi Tailwind dirette
- Tema dinamico basato su stato (meteo giorno/notte)
- Dark mode con `dark:` prefix
- Variabili CSS per colori tematici

### Data Fetching Pattern

- Server Components: fetch diretto con caching
- Client Components: custom hooks con SWR/React Query
- API Routes: route handlers per proxy/trasformazione

### Testing Pattern

- Unit: Vitest per utility e hooks
- Component: React Testing Library
- E2E: Playwright per flussi utente

## Feature Development Flow

1. **Design**: Creare spec in `docs/superpowers/specs/`
2. **Plan**: Creare piano in `docs/superpowers/plans/`
3. **Scaffold**: Generare componenti base e types
4. **Implement**: Sviluppare con TDD dove applicabile
5. **Style**: Applicare Tailwind con temi condizionali
6. **Verify**: Testare con `npm test` e `npm run build`
7. **Document**: Aggiornare README e AGENTS.md

## Portal-Specific Patterns

### Weather Widget Pattern

```typescript
// components/features/weather/CurrentWeather.tsx
'use client';

import { WeatherData } from '@/types/weather';
import { getThemeByWeather } from '@/lib/utils';

interface CurrentWeatherProps {
  weather: WeatherData;
}

export function CurrentWeather({ weather }: CurrentWeatherProps) {
  const theme = getThemeByWeather(weather.current.weatherCode, weather.current.isDay);
  
  return (
    <div className={`${theme.bg} rounded-2xl p-6 ${theme.text}`}>
      {/* Content */}
    </div>
  );
}
```

### Map Integration Pattern

```typescript
// components/features/maps/WeatherMap.tsx
'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false });

export function WeatherMap({ cities }) {
  return <Map cities={cities} />;
}
```

### API Service Pattern

```typescript
// services/weather.ts
class WeatherService {
  private async fetchWithCache(url: string) {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  
  async getWeatherByCity(city: City): Promise<WeatherData> {
    // Implementation
  }
}

export const weatherService = new WeatherService();
```

## Verification Focus

- Build statico passa (`npm run build`)
- TypeScript type-check passa (`npx tsc --noEmit`)
- Test suite passa (`npm test`)
- Lighthouse score > 90 per performance e SEO

## Documentation Focus

- UI behavior per ogni componente
- Routes/pages structure
- Design-system mappings
- API integration patterns
- SEO meta e Open Graph configuration
