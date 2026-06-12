import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ExternalLink, Calendar, ArrowLeft, Newspaper } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { newsService } from '@/services/news';
import { NewsItem } from '@/types/news';

interface Props {
  params: Promise<{ id: string }>;
}

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
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function generateStaticParams() {
  try {
    const items = await newsService.getWeatherNews(20);
    return items.map((item) => ({ id: item.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const item = await newsService.getItemById(id);
    if (!item) return { title: 'Notizia non trovata | MeteoItalia' };
    return {
      title: `${item.title} | MeteoItalia`,
      description: item.description.slice(0, 160),
      openGraph: {
        title: item.title,
        description: item.description.slice(0, 160),
        type: 'article',
        images: item.thumbnail ? [{ url: item.thumbnail }] : undefined,
      },
    };
  } catch {
    return { title: 'Notizia | MeteoItalia' };
  }
}

export default async function NotiziaPage({ params }: Props) {
  const { id } = await params;
  let item: NewsItem | null = null;
  try {
    item = await newsService.getItemById(id);
  } catch (err: unknown) {
    console.error(err);
  }
  if (!item) notFound();

  const style = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.Generale;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/notizie"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alle notizie
        </Link>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/notizie" className="hover:text-blue-500">
            Notizie
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 dark:text-white font-medium truncate max-w-[200px]">
            {item.category}
          </span>
        </nav>

        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {item.thumbnail && (
            <div className="relative h-64 md:h-96 bg-slate-200 dark:bg-slate-700">
              <Image
                src={item.thumbnail}
                alt=""
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
                unoptimized
                priority
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
                {item.category}
              </span>
              <span className="text-sm text-slate-500 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(item.pubDate)}
              </span>
              <span className="text-sm text-slate-500 inline-flex items-center gap-1">
                <Newspaper className="w-3 h-3" />
                {item.source}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 leading-tight">
              {item.title}
            </h1>

            {item.description && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Apri fonte originale
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href="/notizie"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Altre notizie
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-500 italic">
              MeteoItalia aggrega notizie da fonti RSS pubbliche (Google News, ANSA) e non è
              responsabile dei contenuti esterni. Clicca su &quot;Apri fonte originale&quot; per
              leggere l&apos;articolo completo.
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
