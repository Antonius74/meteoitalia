import Link from 'next/link';
import { CloudOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <CloudOff className="w-16 h-16 text-slate-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Città non trovata
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Non abbiamo trovato le previsioni per la località richiesta. Prova a cercare un&apos;altra
          città dalla homepage.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
