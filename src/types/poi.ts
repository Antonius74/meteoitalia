export type PoiCategory =
  | 'museo'
  | 'monumento'
  | 'natura'
  | 'parco'
  | 'spiaggia'
  | 'lago'
  | 'montagna'
  | 'passeggiata'
  | 'locali'
  | 'famiglia'
  | 'sport'
  | 'cibo';

export type WeatherSuitability = 'ottimo' | 'buono' | 'accettabile' | 'sconsigliato';

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  description: string;
  indoor: boolean;
  family: boolean;
  bestMonths?: number[];
  link?: string;
  lat: number;
  lon: number;
  source: 'overpass' | 'wikipedia' | 'fallback';
}

export interface RecurringEvent {
  id: string;
  name: string;
  type: 'mercato' | 'festa' | 'fiera' | 'musica' | 'sport' | 'cultura';
  description: string;
  link?: string;
}

export interface CityInfo {
  name: string;
  description: string;
  extract: string;
  thumbnail?: string;
  wikipediaUrl: string;
}

export interface CityAdvice {
  info: CityInfo | null;
  pois: Poi[];
  events: RecurringEvent[];
  fetchedAt: string;
}
