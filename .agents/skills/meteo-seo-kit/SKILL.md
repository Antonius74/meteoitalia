# Meteo SEO Kit

Utility skill per ottimizzazione SEO del portale meteo.

## Scopo

Fornisce pattern standardizzati per:
- Meta tag dinamici per pagine città
- Open Graph tags per social sharing
- Sitemap generation
- Structured data (JSON-LD)
- Performance optimization

## Metadata Pattern

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MeteoItalia - Previsioni Meteo in Tempo Reale",
  description: "Previsioni meteo accurate per tutte le città italiane.",
  keywords: ["meteo", "previsioni", "Italia", "tempo", "temperature"],
  openGraph: {
    title: "MeteoItalia",
    description: "Previsioni meteo accurate",
    type: "website",
    locale: "it_IT",
  },
};
```

## Dynamic Metadata Pattern

```typescript
// app/citta/[slug]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);
  
  return {
    title: `Meteo ${cityName} - Previsioni 7 Giorni | MeteoItalia`,
    description: `Previsioni meteo dettagliate per ${cityName}.`,
    openGraph: {
      title: `Meteo ${cityName}`,
      description: `Previsioni meteo per ${cityName}`,
    },
  };
}
```

## Static Generation Pattern

```typescript
// Generate static pages for popular cities
export async function generateStaticParams() {
  const cities = ['roma', 'milano', 'napoli', 'torino', 'palermo'];
  return cities.map((city) => ({ slug: city }));
}
```

## JSON-LD Structured Data

```typescript
// components/seo/WeatherStructuredData.tsx
export function WeatherStructuredData({ weather }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WeatherForecast",
    "name": `Meteo ${weather.city.displayName}`,
    "location": {
      "@type": "Place",
      "name": weather.city.displayName,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": weather.city.lat,
        "longitude": weather.city.lon,
      },
    },
    "temperature": {
      "@type": "QuantitativeValue",
      "value": weather.current.temperature,
      "unitCode": "CEL",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

## Performance Optimization

- **Image optimization**: Next.js Image component con lazy loading
- **Font optimization**: `next/font` per caricamento ottimizzato
- **Script optimization**: `next/script` per third-party scripts
- **CSS optimization**: Tailwind purge per produzione

## Caching Headers

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/weather',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },
};
```

## Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = ['roma', 'milano', 'napoli', 'torino', 'palermo'];
  
  return [
    { url: 'https://meteoitalia.it', lastModified: new Date() },
    { url: 'https://meteoitalia.it/previsioni', lastModified: new Date() },
    { url: 'https://meteoitalia.it/radar', lastModified: new Date() },
    ...cities.map(city => ({
      url: `https://meteoitalia.it/citta/${city}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
  ];
}
```

## Related

- [Weather Kit](meteo-weather-kit/SKILL.md)
- [Map Kit](meteo-map-kit/SKILL.md)
- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
