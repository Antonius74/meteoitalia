import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { POPULAR_CITIES } from '@/lib/constants';
import { WORLD_CITIES } from '@/data/cities';
import Link from 'next/link';
import { CalendarDays, MapPin, Globe2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Previsioni Meteo - Italia e Mondo | MeteoItalia',
  description:
    "Previsioni meteo dettagliate per l'Italia, Europa e il mondo. Controlla il meteo per i prossimi 7 giorni.",
};

const EUROPEAN_COUNTRIES = new Set([
  'Francia',
  'Regno Unito',
  'Germania',
  'Spagna',
  'Paesi Bassi',
  'Austria',
  'Svizzera',
  'Repubblica Ceca',
  'Ungheria',
  'Polonia',
  'Grecia',
  'Portogallo',
  'Danimarca',
  'Svezia',
  'Norvegia',
  'Finlandia',
  'Irlanda',
  'Belgio',
  'Russia',
  'Turchia',
]);

const ITALIAN_CITY_NAMES = new Set<string>(POPULAR_CITIES.map((c) => c.name));

const europeFromWorld = WORLD_CITIES.filter(
  (city) => !ITALIAN_CITY_NAMES.has(city.name) && EUROPEAN_COUNTRIES.has(city.region),
);
const worldFromWorld = WORLD_CITIES.filter(
  (city) => !ITALIAN_CITY_NAMES.has(city.name) && !EUROPEAN_COUNTRIES.has(city.region),
);

export default function PrevisioniPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Previsioni Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Consulta le previsioni meteo dettagliate per le principali città italiane e del mondo.
          </p>
        </div>

        <section className="mb-12" aria-labelledby="italia-heading">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h2
              id="italia-heading"
              className="text-2xl font-bold text-slate-800 dark:text-white"
            >
              Italia
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {POPULAR_CITIES.map((city) => (
              <CityCard
                key={city.name}
                slug={city.name}
                name={city.displayName}
                sub={city.region}
              />
            ))}
          </div>
        </section>

        <section className="mb-12" aria-labelledby="europa-heading">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-6 h-6 text-green-500" />
            <h2
              id="europa-heading"
              className="text-2xl font-bold text-slate-800 dark:text-white"
            >
              Europa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {europeFromWorld.map((city) => (
              <CityCard
                key={city.name}
                slug={city.name}
                name={city.displayName}
                sub={city.region}
              />
            ))}
          </div>
        </section>

        <section className="mb-12" aria-labelledby="mondo-heading">
          <div className="flex items-center gap-2 mb-6">
            <Globe2 className="w-6 h-6 text-purple-500" />
            <h2
              id="mondo-heading"
              className="text-2xl font-bold text-slate-800 dark:text-white"
            >
              Mondo
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {worldFromWorld.map((city) => (
              <CityCard
                key={city.name}
                slug={city.name}
                name={city.displayName}
                sub={city.region}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CityCard({ slug, name, sub }: { slug: string; name: string; sub: string }) {
  return (
    <Link
      href={`/citta/${slug}`}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-slate-500">{sub}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </Link>
  );
}
