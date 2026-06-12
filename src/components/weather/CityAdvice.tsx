'use client';

import { useEffect, useMemo, useState } from 'react';
import { CityAdvice as CityAdviceType, Poi, PoiCategory, RecurringEvent } from '@/types/poi';
import { rankPois, summarizeWeather, WeatherContext } from '@/lib/weatherAdvice';
import { getWeatherEmoji } from '@/lib/icons';
import { fetchPoisForCity, fetchCityInfo, fetchEvents } from '@/services/poi';
import {
  MapPin,
  Compass,
  Calendar,
  ExternalLink,
  Loader2,
  Sparkles,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  ThermometerSun,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CityAdviceProps {
  displayName: string;
  lat: number;
  lon: number;
  citySlug?: string;
  weather: WeatherContext;
  date?: string;
  variant?: 'default' | 'compact';
  initialPois?: Poi[];
  initialInfo?: CityAdviceType['info'] | null;
  initialEvents?: RecurringEvent[];
}

const CATEGORY_ICON: Record<PoiCategory, string> = {
  museo: '🏛️',
  monumento: '🏰',
  natura: '🌲',
  parco: '🌳',
  spiaggia: '🏖️',
  lago: '💧',
  montagna: '⛰️',
  passeggiata: '🚶',
  locali: '🍷',
  famiglia: '👨‍👩‍👧',
  sport: '🏃',
  cibo: '🍴',
};

const SUITABILITY_STYLES = {
  ottimo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  buono: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  accettabile: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  sconsigliato: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
};

const SUITABILITY_LABEL = {
  ottimo: 'Consigliato',
  buono: 'Buono',
  accettabile: 'Accettabile',
  sconsigliato: 'Sconsigliato',
};

export default function CityAdvice({
  displayName,
  lat,
  lon,
  citySlug = '',
  weather,
  date,
  variant = 'default',
  initialPois = [],
  initialInfo = null,
  initialEvents = [],
}: CityAdviceProps) {
  const hasInitial = useMemo(
    () => initialPois.length > 0 || initialInfo !== null,
    [initialPois.length, initialInfo],
  );

  const [info, setInfo] = useState<CityAdviceType['info'] | null>(initialInfo);
  const [pois, setPois] = useState<Poi[]>(initialPois);
  const [events, setEvents] = useState<RecurringEvent[]>(initialEvents);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(hasInitial);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [infoData, poisData, eventsData] = await Promise.all([
        fetchCityInfo(displayName).catch(() => null),
        fetchPoisForCity(lat, lon, citySlug, displayName, 8000).catch(() => []),
        fetchEvents(displayName, weather.month).catch(() => []),
      ]);
      setInfo(infoData);
      setPois(poisData);
      setEvents(eventsData);
      setFetched(true);
    } catch (err: unknown) {
      console.error('CityAdvice fetch error:', err);
      setError('Impossibile caricare i consigli meteo in tempo reale.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitial) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      void fetchAll();
    }
  }, [hasInitial]);

  if (loading) {
    return (
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Sto cercando luoghi ed eventi per {displayName}…</span>
        </div>
      </div>
    );
  }

  const ranked = rankPois(pois, weather, variant === 'compact' ? 3 : 4);

  return (
    <div className="space-y-6">
      <MeteoSummary weather={weather} date={date} />

      {info && variant === 'default' && (
        <section
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
          aria-labelledby="city-info-heading"
        >
          <div className="flex items-start gap-2 mb-3">
            <Compass className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
            <h2
              id="city-info-heading"
              className="text-xl font-bold text-slate-800 dark:text-white"
            >
              {displayName}
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-6">
            {info.extract}
          </p>
          <a
            href={info.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
          >
            Continua a leggere su Wikipedia
            <ExternalLink className="w-3 h-3" />
          </a>
        </section>
      )}

      <section
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
        aria-labelledby="poi-heading"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2
              id="poi-heading"
              className="text-xl font-bold text-slate-800 dark:text-white"
            >
              Cosa fare in base al meteo
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {pois.length} luoghi trovati in 8 km
            </span>
            {fetched && (
              <button
                onClick={fetchAll}
                aria-label="Aggiorna suggerimenti"
                className="text-slate-400 hover:text-blue-500"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {ranked.length === 0 ? (
          <p className="text-slate-500">
            {pois.length === 0
              ? 'Nessun POI trovato in zona in questo momento. Riprova ad aggiornare.'
              : 'Nessun suggerimento adatto a queste condizioni meteo.'}
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {ranked.map((rec) => (
              <PoiItem
                key={rec.poi.id}
                poi={rec.poi}
                reasons={rec.reasons}
                suitability={rec.suitability}
              />
            ))}
          </ul>
        )}
      </section>

      {events.length > 0 && (
        <section
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
          aria-labelledby="events-heading"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h2
              id="events-heading"
              className="text-xl font-bold text-slate-800 dark:text-white"
            >
              Eventi del mese
            </h2>
          </div>
          <ul className="space-y-3" role="list">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MeteoSummary({ weather, date }: { weather: WeatherContext; date?: string }) {
  const summary = summarizeWeather(weather);
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl" role="img" aria-hidden="true">
          {getWeatherEmoji(weather.weatherCode)}
        </span>
        <div>
          <h3 className="font-bold text-lg">Meteo previsto</h3>
          {date && (
            <p className="text-blue-100 text-sm">
              {new Date(date).toLocaleDateString('it-IT', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </p>
          )}
        </div>
      </div>
      <p className="text-xl font-semibold mb-3">{summary}</p>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm" role="list">
        <MeteoFact
          icon={<ThermometerSun className="w-4 h-4" />}
          label="Temp"
          value={`${Math.round(weather.temperature)}°C`}
        />
        <MeteoFact
          icon={
            weather.precipitationProbability > 30 ? (
              <CloudRain className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )
          }
          label="Pioggia"
          value={`${weather.precipitationProbability}%`}
        />
        <MeteoFact
          icon={<Wind className="w-4 h-4" />}
          label="Vento"
          value={`${Math.round(weather.windSpeed)} km/h`}
        />
        {weather.weatherCode >= 71 && weather.weatherCode <= 86 && (
          <MeteoFact icon={<Snowflake className="w-4 h-4" />} label="Neve" value="Sì" />
        )}
      </ul>
    </div>
  );
}

function MeteoFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 backdrop-blur-sm">
      <span aria-hidden="true">{icon}</span>
      <span className="text-blue-100 text-xs">{label}</span>
      <span className="font-semibold ml-auto">{value}</span>
    </li>
  );
}

function PoiItem({
  poi,
  reasons,
  suitability,
}: {
  poi: Poi;
  reasons: string[];
  suitability: 'ottimo' | 'buono' | 'accettabile' | 'sconsigliato';
}) {
  return (
    <li className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0" aria-hidden="true">
          {CATEGORY_ICON[poi.category]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 dark:text-white">{poi.name}</h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SUITABILITY_STYLES[suitability]}`}
            >
              {SUITABILITY_LABEL[suitability]}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
            {poi.description}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2 line-clamp-2">
            💡 {reasons[0]}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {poi.lat.toFixed(3)}°, {poi.lon.toFixed(3)}°
            </span>
            {poi.link && (
              <a
                href={poi.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-500 hover:underline"
              >
                Info
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function EventItem({ event }: { event: RecurringEvent }) {
  return (
    <li className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-800 dark:text-white text-sm">{event.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
            {event.description}
          </p>
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
            >
              Approfondisci
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
