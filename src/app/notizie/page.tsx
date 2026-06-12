import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ExternalLink, Calendar, Newspaper, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { newsService } from '@/services/news';
import { NewsItem } from '@/types/news';

export const metadata: Metadata = {
  title: 'Notizie Meteo - News e Approfondimenti | MeteoItalia',
  description:
    "Ultime notizie meteo, allerte meteorologiche e approfondimenti sul clima in Italia e nel mondo. Fonte: Google News e ANSA.",
};

const CATEGORY_STYLES: Record<string, string> = {
  Allerta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Maltempo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Previsioni: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Clima: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Cronaca: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Generale: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'Allerta':
      return '⚠️';
    case 'Maltempo':
      return '⛈️';
    case 'Previsioni':
      return '🌤️';
    case 'Clima':
      return '🌍';
    case 'Cronaca':
      return '📰';
    default:
      return '📰';
  }
}

export default async function NotiziePage() {
  let news: NewsItem[] = [];
  let error: string | null = null;

  try {
    news = await newsService.getWeatherNews(30);
  } catch (err: unknown) {
    console.error('News fetch error:', err);
    error = 'Impossibile caricare le notizie in tempo reale. Riprova più tardi.';
  }

  if (!news.length && !error) {
    notFound();
  }

  const [featured, ...rest] = news;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            <Newspaper className="w-4 h-4" />
            Aggiornato in tempo reale
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Notizie Meteo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Le ultime notizie meteorologiche, allerte e approfondimenti sul clima. Feed RSS da
            Google News e ANSA Cronaca.
          </p>
        </div>

        {error && (
          <div
            className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 flex items-start gap-3"
            role="alert"
          >
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 dark:text-amber-200 font-medium">{error}</p>
              <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                Verifica la connessione e ricarica la pagina.
              </p>
            </div>
          </div>
        )}

        {featured && (
          <article className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {categoryEmoji(featured.category)} In Evidenza · {featured.category}
                </span>
                <span className="text-sm text-blue-200 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(featured.pubDate)}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                {featured.title}
              </h2>
              {featured.description && (
                <p className="text-blue-100 mb-4 max-w-3xl line-clamp-3">
                  {featured.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-blue-200">Fonte: {featured.source}</span>
                <Link
                  href={`/notizie/${featured.id}`}
                  className="px-4 py-2 bg-white text-blue-800 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
                >
                  Leggi tutto
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href={featured.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white inline-flex items-center gap-1 hover:underline"
                >
                  Apri fonte originale
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </article>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const style = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.Generale;
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
      <Link
        href={`/notizie/${item.id}`}
        className="block"
        aria-label={`Apri notizia: ${item.title}`}
      >
        {item.thumbnail ? (
          <div className="relative h-48 bg-slate-200 dark:bg-slate-700">
            <Image
              src={item.thumbnail}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            <span className="text-6xl" aria-hidden="true">
              {categoryEmoji(item.category)}
            </span>
          </div>
        )}
      </Link>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
            {item.category}
          </span>
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.pubDate)}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">
          <Link href={`/notizie/${item.id}`} className="hover:text-blue-500 transition-colors">
            {item.title}
          </Link>
        </h3>

        {item.description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/notizie/${item.id}`}
            className="text-blue-500 font-medium hover:text-blue-600 transition-colors inline-flex items-center gap-1"
          >
            Leggi tutto →
          </Link>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1"
            aria-label="Apri fonte originale"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
