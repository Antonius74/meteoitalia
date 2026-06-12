# 🌤️ MeteoItalia

Un portale meteo italiano moderno, veloce e completamente gratuito. Consulta le previsioni per ogni città italiana ed europea con dati in tempo reale, mappe interattive e radar delle precipitazioni.

🔗 **Demo online**: [https://antonius74.github.io/meteoitalia](https://antonius74.github.io/meteoitalia) *(prossimamente)*  
📦 **Repository**: [https://github.com/Antonius74/meteoitalia](https://github.com/Antonius74/meteoitalia)

---

## 📸 Screenshot

| Home | Città | Radar |
|------|-------|-------|
| Previsioni 7 giorni, meteo attuale | Dettaglio temperatura, vento, pressione | Precipitazioni in tempo reale |

---

## ✨ Caratteristiche

- 🌡️ **Previsioni 7 giorni** per tutte le città italiane ed europee
- 🗺️ **Mappa interattiva** con layer temperatura, vento, pressione, pioggia
- 📡 **Radar precipitazioni** in tempo reale (RainViewer)
- 🔍 **Ricerca città** rapida con autocomplete
- 🌙 **Dark mode** automatica
- 📱 **Responsive** (mobile, tablet, desktop)
- ⚡ **Velocità** — sito statico pre-generato, nessun server necessario
- 🆓 **Gratuito** — usa API meteo gratuite (Open-Meteo)

---

## 🚀 Installazione (per principianti)

Non serve essere esperti di programmazione. Segui questi passi in ordine:

### 1. Scarica il progetto

Clicca il pulsante verde **"Code"** in alto a destra su GitHub, poi **"Download ZIP"**.  
Estrai il file ZIP in una cartella sul tuo computer (es. `Documenti/meteoitalia`).

### 2. Installa Node.js

Vai su [https://nodejs.org](https://nodejs.org) e scarica la versione **LTS** (quella consigliata).  
Installala come un normale programma (Next, Next, Finish).

Per verificare che sia installato, apri il terminale (Prompt dei comandi su Windows, Terminale su Mac) e scrivi:

```bash
node --version
```

Deve apparire qualcosa come `v20.x.x`. Se dà errore, riavvia il computer.

### 3. Installa le dipendenze

Apri il terminale nella cartella del progetto (quella dove c'è il file `package.json`) e scrivi:

```bash
npm install
```

Aspetta che finisca (scaricherà tutte le librerie necessarie).

### 4. Avvia in locale

Sempre nello stesso terminale, scrivi:

```bash
npm run dev
```

Aspetta qualche secondo e poi apri il browser all'indirizzo:  
**http://localhost:3000**

Il sito è ora in esecuzione sul tuo computer!

### 5. Ferma il server

Per chiudere, premi `Ctrl + C` nel terminale.

---

## 📦 Build per la produzione

Per creare la versione definitiva (sito statico pronto per essere pubblicato):

```bash
npm run build
```

La cartella `dist/` conterrà il sito finale. Puoi pubblicarla su:
- **GitHub Pages** (gratuito)
- **Vercel** (gratuito)
- **Netlify** (gratuito)
- Qualsiasi hosting statico

---

## 🛠️ Tecnologie usate

| Tecnologia | Versione | Scopo |
|-----------|----------|-------|
| Next.js | 16 | Framework React con App Router |
| React | 19 | Libreria UI |
| TypeScript | 5.7 | Tipizzazione codice |
| Tailwind CSS | 4 | Stili responsive |
| Leaflet | latest | Mappe interattive |
| Recharts | latest | Grafici temperature |
| Open-Meteo | API gratuita | Dati meteorologici |

---

## 📁 Struttura del progetto

```
meteoitalia/
├── .agents/skills/        ← Skill di sviluppo AI (GEN-skills)
├── docs/                  ← Documentazione architettura
├── public/                ← Immagini, icone, marker mappa
├── src/
│   ├── app/               ← Pagine del sito
│   │   ├── page.tsx       ← Homepage
│   │   ├── citta/[slug]/  ← Pagina dettaglio città
│   │   ├── radar/         ← Radar precipitazioni
│   │   ├── mappe/         ← Mappa interattiva
│   │   ├── previsioni/    ← Lista città
│   │   └── notizie/       ← News meteo
│   ├── components/        ← Componenti React
│   │   ├── layout/        ← Header, Footer
│   │   ├── weather/       ← Widget meteo, previsioni
│   │   ├── maps/          ← RainViewerMap, WeatherMap
│   │   └── search/        ← SearchBar
│   ├── hooks/             ← useWeather, useCitySearch
│   ├── services/          ← weather.ts (API client)
│   ├── types/             ← TypeScript interfaces
│   └── lib/               ← Utils, constants
├── next.config.ts         ← Configurazione build
└── package.json           ← Dipendenze
```

---

## 🧠 Strategie di sviluppo

### 1. Architecture as Code

Il progetto segue il pattern **GEN-skills-develop** di Nexi, un framework per skill AI governate. La struttura `.agents/skills/` contiene:

- **Provider** (`nexi-web-portal-provider`) — workflow base per portali web
- **Variant** (`web-portal-frontend-runtime`) — convenzioni Next.js/React
- **Contracts** (`nexi-web-portal-contracts`) — API e component contracts
- **Utilities**:
  - `meteo-weather-kit` — pattern dati meteo Open-Meteo
  - `meteo-map-kit` — pattern Leaflet e radar
  - `meteo-seo-kit` — pattern SEO e metadata
  - `grill-me` — revisione implementazione
  - `verification-before-completion` — quality gates
  - `skill-scanner` — security assessment

### 2. Static Site Generation (SSG)

Ogni pagina città è **pre-generata** a build time:
- 32 pagine statiche (12 Italia + 17 Europa + 5 Mondo)
- Tempo di caricamento istantaneo
- Nessun server necessario per la produzione
- SEO ottimale con meta tag dinamici

### 3. Componenti Server + Client

- **Server Components** per fetch dati e SEO (metadati, sitemap)
- **Client Components** ('use client') per interattività (mappe, ricerca, pulsanti)
- **Dynamic imports** per librerie che usano `window` (Leaflet)

### 4. Caching strategico

- **ISR** (Incremental Static Regeneration) con `revalidate: 300` (5 min)
- **Client cache** per evitare fetch ripetuti
- **RainViewer tiles** con timestamp per cache-busting

### 5. Type Safety

- TypeScript strict mode
- Interfacce per tutti i dati meteo (`WeatherData`, `City`, `CurrentWeather`)
- Nessun `any` implicito

---

## 🧪 Testing

```bash
npm test          # Test unitari
npm run build     # Verifica build
```

---

## 📝 Convenzioni di codice

- **File**: `kebab-case.tsx` (es. `current-weather.tsx`)
- **Componenti**: `PascalCase` (es. `CurrentWeather.tsx`)
- **Hooks**: `camelCase` con prefisso `use` (es. `useWeather.ts`)
- **Servizi**: `camelCase` con suffisso `Service` (es. `weatherService.ts`)

---

## 🌍 API esterne

| Servizio | URL | Dato |
|----------|-----|------|
| Open-Meteo | https://open-meteo.com | Previsioni meteo |
| Open-Meteo Geocoding | https://geocoding-api.open-meteo.com | Ricerca città |
| RainViewer | https://rainviewer.com | Radar precipitazioni |
| OpenStreetMap | https://openstreetmap.org | Tiles mappa |

Tutte le API sono **gratuite** e **non richiedono API key**.

---

## 🔐 Sicurezza

- Nessun secret o API key nel codice
- Input sanitization su ricerca città
- Output encoding per prevenire XSS
- Content Security Policy via Next.js headers

---

## 🤝 Contribuire

1. Fai un fork del repository
2. Crea un branch: `git checkout -b feature/nuova-funzione`
3. Fai le modifiche e commit: `git commit -m "feat: nuova funzione"`
4. Pusha: `git push origin feature/nuova-funzione`
5. Apri una Pull Request su GitHub

---

## 📄 Licenza

MIT License — libero uso, modifica e distribuzione.

---

## 🙏 Crediti

- Dati meteorologici: [Open-Meteo](https://open-meteo.com)
- Radar: [RainViewer](https://rainviewer.com)
- Mappe: [OpenStreetMap](https://openstreetmap.org) + [Leaflet](https://leafletjs.com)
- Icons: [Lucide React](https://lucide.dev)

---

**Realizzato con ❤️ per l'Italia** 🇮🇹
