import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Notizie Meteo - News e Approfondimenti | MeteoItalia',
  description: 'Ultime notizie meteo, allerte meteorologiche e approfondimenti sul clima in Italia e nel mondo.',
};

export default function NotiziePage() {
  const news = [
    {
      title: 'Allerta meteo: temporali in arrivo al Nord Italia',
      excerpt: `Il centro meteo europeo segnala l'arrivo di una perturbazione che porterà piogge e temporali sulle regioni settentrionali.`,
      category: 'Allerta',
      date: '12 Giugno 2026',
      color: 'bg-red-100 text-red-700',
    },
    {
      title: 'Ondata di calore prevista per il weekend',
      excerpt: 'Temperature in rialzo previste su gran parte del paese con picchi fino a 35°C nelle città del Sud.',
      category: 'Caldo',
      date: '11 Giugno 2026',
      color: 'bg-orange-100 text-orange-700',
    },
    {
      title: 'Migliora il tempo al Centro-Sud',
      excerpt: 'Dopo giorni di instabilità, torna il sole su Lazio, Campania, Puglia e Sicilia.',
      category: 'Previsioni',
      date: '10 Giugno 2026',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Cambiamento climatico: il 2026 anno più caldo?',
      excerpt: `Gli esperti analizzano i dati globali e l'impatto del Niño sulle temperature medie planetarie.`,
      category: 'Clima',
      date: '9 Giugno 2026',
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'Grandine record in Veneto',
      excerpt: 'Violenti temporali hanno colpito la regione con chicchi di grandine fino a 5 cm di diametro.',
      category: 'Eventi',
      date: '8 Giugno 2026',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Previsioni estate 2026: cosa ci attende?',
      excerpt: 'Lunghe analisi sulle tendenze stagionali per i mesi di luglio, agosto e settembre.',
      category: 'Stagione',
      date: '7 Giugno 2026',
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Notizie Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Le ultime news meteorologiche, allerte e approfondimenti sul clima.
          </p>
        </div>

        {/* Featured News */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
            In Evidenza
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Allerta meteo: temporali in arrivo al Nord Italia
          </h2>
          <p className="text-blue-100 mb-4 max-w-2xl">
            Il centro meteo europeo segnala l'arrivo di una perturbazione che porterà piogge 
            e temporali sulle regioni settentrionali nelle prossime 24 ore.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-200">12 Giugno 2026</span>
            <button className="px-4 py-2 bg-white text-blue-800 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Leggi tutto
            </button>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <article
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <span className="text-6xl">
                  {item.category === 'Allerta' ? '⚡' :
                   item.category === 'Caldo' ? '☀️' :
                   item.category === 'Previsioni' ? '🌤️' :
                   item.category === 'Clima' ? '🌍' :
                   item.category === 'Eventi' ? '🌪️' : '📅'}
                </span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                    {item.category}
                  </span>
                  <span className="text-sm text-slate-500">{item.date}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  {item.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {item.excerpt}
                </p>
                
                <button className="mt-4 text-blue-500 font-medium text-sm hover:text-blue-600 transition-colors">
                  Leggi tutto →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}