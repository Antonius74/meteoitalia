import Link from 'next/link';
import { CloudSun, Mail, Globe } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CloudSun className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-bold text-white">MeteoItalia</span>
            </div>
            <p className="text-sm text-slate-400">
              Le previsioni meteo più accurate per l'Italia. 
              Aggiornamenti in tempo reale e mappe interattive.
            </p>
          </div>

          {/* Links rapidi */}
          <div>
            <h3 className="text-white font-semibold mb-4">Previsioni</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Italia</Link></li>
              <li><Link href="/previsioni/europa" className="hover:text-blue-400 transition-colors">Europa</Link></li>
              <li><Link href="/previsioni/mondo" className="hover:text-blue-400 transition-colors">Mondo</Link></li>
              <li><Link href="/previsioni/mare" className="hover:text-blue-400 transition-colors">Mare</Link></li>
            </ul>
          </div>

          {/* Mappe */}
          <div>
            <h3 className="text-white font-semibold mb-4">Mappe</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/radar" className="hover:text-blue-400 transition-colors">Radar</Link></li>
              <li><Link href="/satellite" className="hover:text-blue-400 transition-colors">Satellite</Link></li>
              <li><Link href="/temperature" className="hover:text-blue-400 transition-colors">Temperature</Link></li>
              <li><Link href="/vento" className="hover:text-blue-400 transition-colors">Vento</Link></li>
            </ul>
          </div>

          {/* Contatti */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contatti</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chi-siamo" className="hover:text-blue-400 transition-colors">Chi siamo</Link></li>
              <li><Link href="/pubblicita" className="hover:text-blue-400 transition-colors">Pubblicità</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy</Link></li>
              <li><Link href="/cookie" className="hover:text-blue-400 transition-colors">Cookie</Link></li>
            </ul>
            
            <div className="flex gap-3 mt-4">
              <a href="#" className="hover:text-blue-400 transition-colors"><Globe className="w-5 h-5" /></a>
              <a href="#" className="hover:text-blue-400 transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          <p>© {currentYear} MeteoItalia. Tutti i diritti riservati.</p>
          <p className="mt-2">
            Dati meteorologici forniti da <a href="https://open-meteo.com" className="text-blue-400 hover:text-blue-300">Open-Meteo</a>
          </p>
        </div>
      </div>
    </footer>
  );
}