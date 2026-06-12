import Link from 'next/link';
import { CloudSun } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const PREVISIONI_LINKS = [
  { href: '/', label: 'Italia' },
  { href: '/previsioni', label: 'Tutte le città' },
];

const MAPPE_LINKS = [
  { href: '/radar', label: 'Radar' },
  { href: '/mappe', label: 'Mappa interattiva' },
];

const INFO_LINKS = [
  { href: '/notizie', label: 'Notizie' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CloudSun className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-bold text-white">MeteoItalia</span>
            </div>
            <p className="text-sm text-slate-400">
              Le previsioni meteo più accurate per l&apos;Italia. Aggiornamenti in tempo reale e
              mappe interattive.
            </p>
          </div>

          <FooterColumn title="Previsioni" links={PREVISIONI_LINKS} />
          <FooterColumn title="Mappe" links={MAPPE_LINKS} />
          <FooterColumn title="Risorse" links={INFO_LINKS} />
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          <p>© {CURRENT_YEAR} MeteoItalia. Tutti i diritti riservati.</p>
          <p className="mt-2">
            Dati meteorologici forniti da{' '}
            <a href="https://open-meteo.com" className="text-blue-400 hover:text-blue-300">
              Open-Meteo
            </a>
            , mappe da{' '}
            <a href="https://www.rainviewer.com" className="text-blue-400 hover:text-blue-300">
              RainViewer
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-blue-400 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
