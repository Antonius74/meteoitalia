import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { findCityBySlug, WORLD_CITIES, getPopularCityList } from '@/data/cities';
import { weatherService } from '@/services/weather';
import { WeatherData } from '@/types/weather';
import { groupHourlyByDay } from '@/lib/hourlyGrouping';
import HourlyForecast from '@/components/weather/HourlyForecast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CurrentWeather from '@/components/weather/CurrentWeather';
import MapWrapper from '@/components/weather/MapWrapper';
import CityAdvice from '@/components/weather/CityAdvice';
import { getStaticPoisForCity, fetchCityInfo, fetchEvents } from '@/services/poi';

interface Props {
  params: Promise<{ slug: string; date: string }>;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function formatDateLong(date: string): string {
  return new Date(date).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateStaticParams() {
  const all = [...getPopularCityList(), ...WORLD_CITIES];
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return all.flatMap((c) => dates.map((date) => ({ slug: c.name, date })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, date } = await params;
  const city = findCityBySlug(slug);
  const cityName = city?.displayName ?? slug;
  return {
    title: `Meteo ${cityName} - ${formatDateLong(date)} | MeteoItalia`,
    description: `Previsioni meteo orarie per ${cityName} del ${formatDateLong(date)}. Temperature, precipitazioni, vento e umidità ora per ora.`,
  };
}

async function loadWeather(slug: string) {
  const local = findCityBySlug(slug);
  const city =
    local ?? (await weatherService.searchCities(slug.replace(/-/g, ' ')))[0];
  if (!city) return null;
  return weatherService.getWeatherByCity(city);
}

export default async function DayPage({ params }: Props) {
  const { slug, date } = await params;

  if (!isValidDate(date)) notFound();

  let weather: WeatherData | null = null;
  try {
    weather = await loadWeather(slug);
  } catch (err: unknown) {
    console.error(err);
  }
  if (!weather) notFound();

  const grouped = groupHourlyByDay(weather.hourly);
  const dayEntry = grouped.find((d) => d.date === date);
  if (!dayEntry) notFound();

  const idx = grouped.findIndex((d) => d.date === date);
  const prevDate = idx > 0 ? grouped[idx - 1].date : null;
  const nextDate = idx < grouped.length - 1 ? grouped[idx + 1].date : null;
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  const isFuture = date > today;

  const daySummary = weather.daily.find((d) => d.date === date);

  const mapCity = {
    name: weather.city.name,
    displayName: weather.city.displayName,
    region: weather.city.region,
    lat: weather.city.lat,
    lon: weather.city.lon,
    temperature: daySummary?.maxTemp ?? weather.current.temperature,
    windSpeed: daySummary?.windSpeed ?? weather.current.windSpeed,
    pressure: weather.current.pressure,
    humidity: weather.current.humidity,
    precipitation: weather.current.precipitation,
  };

  const month = new Date(date).getMonth() + 1;
  const pois = getStaticPoisForCity(
    weather.city.name,
    weather.city.displayName,
    weather.city.lat,
    weather.city.lon,
  );
  const [info, events] = await Promise.all([
    fetchCityInfo(weather.city.displayName).catch(() => null),
    fetchEvents(weather.city.displayName, month).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/citta/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-500 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Torna a {weather.city.displayName}
        </Link>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4" />
          <Link href={`/citta/${slug}`} className="hover:text-blue-500">
            {weather.city.displayName}
          </Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-slate-800 dark:text-white font-medium capitalize">
            {isToday ? 'Oggi' : dayEntry.dayOfWeek} {date.split('-').reverse().join('/')}
          </span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2 capitalize">
            {isToday ? 'Oggi' : dayEntry.dayOfWeek} a {weather.city.displayName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 capitalize">
            {formatDateLong(date)} {isFuture && '· previsione'}
          </p>
        </header>

        {isToday && <CurrentWeather weather={weather} />}

        {daySummary && (
          <section
            className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
            aria-labelledby="day-summary"
          >
            <h2
              id="day-summary"
              className="text-xl font-bold mb-4 text-slate-800 dark:text-white"
            >
              Sintesi della giornata
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem
                label="Min / Max"
                value={`${Math.round(daySummary.minTemp)}° / ${Math.round(daySummary.maxTemp)}°`}
              />
              <SummaryItem
                label="Prob. pioggia"
                value={`${daySummary.precipitationProbability}%`}
              />
              <SummaryItem label="Vento max" value={`${Math.round(daySummary.windSpeed)} km/h`} />
              <SummaryItem label="UV max" value={`${Math.round(daySummary.uvIndexMax)}`} />
              <SummaryItem
                label="Alba"
                value={new Date(daySummary.sunrise).toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              <SummaryItem
                label="Tramonto"
                value={new Date(daySummary.sunset).toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </dl>
          </section>
        )}

        <section aria-labelledby="hourly-heading" className="mb-8">
          <h2
            id="hourly-heading"
            className="text-xl font-bold mb-4 text-slate-800 dark:text-white"
          >
            Previsioni orarie · 24 ore
          </h2>
          <HourlyForecast hourly={dayEntry.hours} citySlug={slug} date={date} />
        </section>

        <div className="mb-8">
          <CityAdvice
            displayName={weather.city.displayName}
            lat={weather.city.lat}
            lon={weather.city.lon}
            date={date}
            weather={{
              weatherCode: dayEntry.hours[Math.floor(dayEntry.hours.length / 2)]?.weatherCode ?? 0,
              temperature: daySummary?.maxTemp ?? weather.current.temperature,
              precipitationProbability: daySummary?.precipitationProbability ?? 0,
              windSpeed: daySummary?.windSpeed ?? weather.current.windSpeed,
              month: new Date(date).getMonth() + 1,
            }}
            initialPois={pois}
            initialInfo={info}
            initialEvents={events}
          />
        </div>

        <nav
          className="flex items-center justify-between gap-4 mb-8"
          aria-label="Navigazione giorni"
        >
          {prevDate ? (
            <Link
              href={`/citta/${slug}/giorno/${prevDate}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-md transition-shadow text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">
                <span className="block text-xs text-slate-500">Precedente</span>
                <span className="font-medium capitalize">
                  {new Date(prevDate).toLocaleDateString('it-IT', { weekday: 'long' })}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}

          {nextDate ? (
            <Link
              href={`/citta/${slug}/giorno/${nextDate}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-md transition-shadow text-slate-700 dark:text-slate-200"
            >
              <span className="text-sm text-right">
                <span className="block text-xs text-slate-500">Successivo</span>
                <span className="font-medium capitalize">
                  {new Date(nextDate).toLocaleDateString('it-IT', { weekday: 'long' })}
                </span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <section aria-labelledby="map-heading">
          <h2
            id="map-heading"
            className="text-2xl font-bold mb-4 text-slate-800 dark:text-white"
          >
            Mappa
          </h2>
          <MapWrapper
            cities={[mapCity]}
            center={[weather.city.lat, weather.city.lon]}
            zoom={11}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-lg font-semibold text-slate-800 dark:text-white">{value}</dd>
    </div>
  );
}
