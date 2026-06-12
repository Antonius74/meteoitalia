'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useCitySearch } from '@/hooks/useCitySearch';
import { City } from '@/types/weather';

interface SearchBarProps {
  onCitySelect: (city: City) => void;
  placeholder?: string;
}

export default function SearchBar({ onCitySelect, placeholder = "Cerca città italiane..." }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading, search, clear } = useCitySearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      search(value);
      setIsOpen(true);
    } else {
      clear();
      setIsOpen(false);
    }
  };

  const handleSelect = (city: City) => {
    onCitySelect(city);
    setQuery(city.displayName);
    setIsOpen(false);
    clear();
  };

  const handleClear = () => {
    setQuery('');
    clear();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown risultati */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {loading && (
            <div className="p-4 text-center text-slate-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
          
          {!loading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((city, index) => (
                <li key={`${city.name}-${index}`}>
                  <button
                    onClick={() => handleSelect(city)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{city.displayName}</p>
                      <p className="text-sm text-slate-500">{city.region}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}