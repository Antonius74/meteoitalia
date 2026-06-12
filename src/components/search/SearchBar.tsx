'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useCitySearch } from '@/hooks/useCitySearch';
import { City } from '@/types/weather';

type SearchBarVariant = 'inline' | 'header';

interface SearchBarProps {
  onCitySelect: (city: City) => void;
  placeholder?: string;
  variant?: SearchBarVariant;
  onSubmitQuery?: (query: string) => void;
}

export default function SearchBar({
  onCitySelect,
  placeholder = 'Cerca città italiane...',
  variant = 'inline',
  onSubmitQuery,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading, search, clear } = useCitySearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = 'search-results-listbox';
  const optionId = (idx: number) => `search-option-${idx}`;

  const isHeader = variant === 'header';
  const inputBaseClass = isHeader
    ? 'w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm'
    : 'w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all';
  const searchIconClass = isHeader
    ? 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400'
    : 'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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

  const handleSelect = useCallback(
    (city: City) => {
      onCitySelect(city);
      setQuery(city.displayName);
      setIsOpen(false);
      clear();
    },
    [onCitySelect, clear],
  );

  const handleClear = () => {
    setQuery('');
    clear();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmitQuery) {
      e.preventDefault();
      onSubmitQuery(query);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className={searchIconClass} aria-hidden="true" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={onSubmitQuery ? handleKeyDown : undefined}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen && (results.length > 0 || loading)}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={inputBaseClass}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Pulisci ricerca"
            className={
              isHeader
                ? 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                : 'absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
            }
          >
            <X className={isHeader ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          id={listboxId}
          role="listbox"
        >
          {loading && (
            <div className="p-4 text-center text-slate-500" role="status">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((city, index) => (
                <li key={`${city.name}-${index}`} id={optionId(index)} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {city.displayName}
                      </p>
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
