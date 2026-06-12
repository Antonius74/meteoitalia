export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: NewsCategory;
  thumbnail?: string;
}

export type NewsCategory =
  | 'Allerta'
  | 'Previsioni'
  | 'Maltempo'
  | 'Clima'
  | 'Cronaca'
  | 'Generale';

export interface NewsFeed {
  source: string;
  url: string;
  items: NewsItem[];
  fetchedAt: string;
}
