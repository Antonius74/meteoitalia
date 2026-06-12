'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, CloudSun } from 'lucide-react';

interface HeaderProps {
  onSearch?: (city: any) => void;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    // Slugifica la query
    const slug = query.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    router.push(`/citta/${slug}/`);
    setSearchQuery('');
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <CloudSun className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              MeteoItalia
            </span>
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca città..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/previsioni/" 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
            >
              Previsioni
            </Link>
            <Link 
              href="/radar/" 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
            >
              Radar
            </Link>
            <Link 
              href="/mappe/" 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
            >
              Mappe
            </Link>
            <Link 
              href="/notizie/" 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
            >
              Notizie
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca città..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <nav className="flex flex-col px-4 py-2">
            <Link 
              href="/" 
              className="py-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/previsioni/" 
              className="py-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Previsioni
            </Link>
            <Link 
              href="/radar/" 
              className="py-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Radar
            </Link>
            <Link 
              href="/mappe/" 
              className="py-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Mappe
            </Link>
            <Link 
              href="/notizie/" 
              className="py-3 text-slate-600 dark:text-slate-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Notizie
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}