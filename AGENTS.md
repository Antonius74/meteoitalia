# MeteoItalia Portal - AGENTS.md

Repository del portale meteo italiano con stack Next.js/TypeScript/Tailwind.

## Quick Start

```bash
npm install
npm run dev        # Development server
npm run build      # Production build
npm test           # Run tests
```

## Project Structure

```
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── services/      # API clients
│   ├── types/         # TypeScript types
│   └── lib/           # Utilities
├── public/            # Static assets
├── docs/              # Documentation
├── .agents/skills/   # GEN-skills
└── next.config.ts     # Next.js config
```

## Environment

- Node.js 20+
- Next.js 16+
- TypeScript 5.7+
- Tailwind CSS 4+

## GEN-skills Reference

| Skill | Type | Purpose |
|-------|------|---------|
| nexi-web-portal-provider | provider | Base workflow provider |
| web-portal-frontend-runtime | variant | Next.js/React runtime |
| meteo-weather-kit | utility | Weather data integration |
| meteo-map-kit | utility | Map integration |
| meteo-seo-kit | utility | SEO optimization |
| grill-me | utility | Implementation review |
| verification-before-completion | utility | Quality gates |
| skill-scanner | utility | Security assessment |

## Managed Block

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## External APIs

- Open-Meteo: https://open-meteo.com (free weather data)
- RainViewer: https://www.rainviewer.com (radar)
- Windy: https://www.windy.com (maps)

## License

MIT
