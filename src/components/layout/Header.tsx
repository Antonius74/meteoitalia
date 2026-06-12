'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, CloudSun } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import { City } from '@/types/weather';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/previsioni', label: 'Previsioni' },
  { href: '/radar', label: 'Radar' },
  { href: '/mappe', label: 'Mappe' },
  { href: '/notizie', label: 'Notizie' },
];

interface HeaderProps {
  onCitySelect?: (city: City) => void;
}

export default function Header({ onCitySelect }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <CloudSun className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              MeteoItalia
            </span>
          </Link>

          {onCitySelect && (
            <div className="hidden md:block flex-1 max-w-md">
              <SearchBar
                variant="header"
                onCitySelect={onCitySelect}
                placeholder="Cerca città..."
              />
            </div>
          )}

          <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          {onCitySelect && (
            <div className="px-4 py-3">
              <SearchBar
                variant="header"
                onCitySelect={(city) => {
                  onCitySelect(city);
                  setIsMenuOpen(false);
                }}
                placeholder="Cerca città..."
              />
            </div>
          )}
          <nav className="flex flex-col px-4 py-2">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`py-3 text-slate-600 dark:text-slate-300 ${
                  index < NAV_LINKS.length - 1
                    ? 'border-b border-slate-100 dark:border-slate-800'
                    : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
