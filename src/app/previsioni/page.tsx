import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { POPULAR_CITIES } from '@/lib/constants';
import Link from 'next/link';
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Previsioni Meteo - Italia e Mondo | MeteoItalia',
  description: 'Previsioni meteo dettagliate per l\'Italia, Europa e il mondo. Controlla il meteo per i prossimi 7 giorni.',
};

export default function PrevisioniPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Previsioni Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Consulta le previsioni meteo dettagliate per le principali città italiane e del mondo.
          </p>
        </div>

        {/* Sezione Italia */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Italia</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/citta/${city.name}`}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                      {city.displayName}
                    </h3>
                    <p className="text-sm text-slate-500">{city.region}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sezione Europa */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Europa</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'parigi', displayName: 'Parigi', country: 'Francia' },
              { name: 'londra', displayName: 'Londra', country: 'Regno Unito' },
              { name: 'berlino', displayName: 'Berlino', country: 'Germania' },
              { name: 'madrid', displayName: 'Madrid', country: 'Spagna' },
              { name: 'amsterdam', displayName: 'Amsterdam', country: 'Paesi Bassi' },
              { name: 'vienna', displayName: 'Vienna', country: 'Austria' },
            ].map((city) => (
              <Link
                key={city.name}
                href={`/citta/${city.name}`}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                      {city.displayName}
                    </h3>
                    <p className="text-sm text-slate-500">{city.country}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}