'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const RainViewerMap = dynamic(() => import('@/components/maps/RainViewerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Caricamento radar...</p>
      </div>
    </div>
  ),
});

export default function RadarPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Radar Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Precipitazioni in tempo reale su mappa interattiva Italia.
            Dati aggiornati ogni 10 minuti da RainViewer.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Radar Precipitazioni</span>
              </span>
            </div>
            <a
              href="https://www.rainviewer.com/it.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              Apri RainViewer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <RainViewerMap />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">
              Come funziona il radar?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              I dati radar mostrano le precipitazioni in tempo reale sulla mappa.
              I colori indicano l'intensità: dal blu (pioggerella) al viola/rosso (temporali forti).
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">
              Legenda intensità
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { color: '#63b4ff', label: 'Molto leggera' },
                { color: '#1e78ff', label: 'Leggera' },
                { color: '#00d900', label: 'Moderata' },
                { color: '#fffb00', label: 'Forte' },
                { color: '#ff9900', label: 'Molto forte' },
                { color: '#ff0000', label: 'Estrema' },
                { color: '#990099', label: 'Grandine' },
                { color: '#990045', label: 'Tempesta' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
