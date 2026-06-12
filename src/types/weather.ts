export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  pressure: number;
  feelsLike: number;
  uvIndex: number;
  visibility: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  visibility: number;
}

export interface DailyHourly {
  date: string;
  dayOfWeek: string;
  hours: HourlyForecast[];
}

export interface City {
  name: string;
  displayName: string;
  region: string;
  lat: number;
  lon: number;
  population?: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  city: City;
  lastUpdated: string;
}

export type WeatherCondition = 
  | 'clear' 
  | 'cloudy' 
  | 'rain' 
  | 'snow' 
  | 'thunderstorm' 
  | 'fog' 
  | 'drizzle' 
  | 'partly-cloudy';

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  accent: string;
  border: string;
}

export interface MapCity {
  name: string;
  displayName: string;
  region?: string;
  lat: number;
  lon: number;
  temperature?: number;
  condition?: string;
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  humidity?: number;
  precipitation?: number;
}