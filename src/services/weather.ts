import { WeatherData, City } from '@/types/weather';
import { API_BASE_URL, GEO_API_URL } from '@/lib/constants';

interface GeoSearchResult {
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

interface GeoApiResponse {
  results?: GeoSearchResult[];
}

interface CurrentWeatherRaw {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  visibility: number;
}

interface DailyWeatherRaw {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
}

interface HourlyWeatherRaw {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  precipitation_probability: number[];
  visibility: number[];
}

interface ForecastResponse {
  current: CurrentWeatherRaw;
  daily: DailyWeatherRaw;
  hourly: HourlyWeatherRaw;
}

class WeatherService {
  private async fetchWithCache<T>(url: string): Promise<T> {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 2) return [];

    const url = `${GEO_API_URL}/search?name=${encodeURIComponent(query)}&count=10&language=it&format=json`;
    const data = await this.fetchWithCache<GeoApiResponse>(url);

    return (data.results ?? []).map((result) => ({
      name: result.name.toLowerCase(),
      displayName: result.name,
      region: result.admin1 ?? '',
      lat: result.latitude,
      lon: result.longitude,
      population: result.population,
    }));
  }

  async getWeatherByCoordinates(lat: number, lon: number, city: City): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,visibility',
      hourly:
        'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability,visibility',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
      timezone: 'Europe/Rome',
      forecast_days: '7',
    });
    const url = `${API_BASE_URL}/forecast?${params.toString()}`;

    const data = await this.fetchWithCache<ForecastResponse>(url);

    const { current, daily, hourly } = data;

    return {
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
        pressure: current.surface_pressure,
        feelsLike: current.apparent_temperature,
        uvIndex: 0,
        visibility: current.visibility,
        precipitation: current.precipitation,
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0],
        isDay: current.is_day === 1,
      },
      daily: daily.time.map((date, index) => ({
        date,
        dayOfWeek: new Date(date).toLocaleDateString('it-IT', { weekday: 'short' }),
        maxTemp: daily.temperature_2m_max[index],
        minTemp: daily.temperature_2m_min[index],
        weatherCode: daily.weather_code[index],
        precipitationProbability: daily.precipitation_probability_max[index],
        windSpeed: daily.wind_speed_10m_max[index],
        sunrise: daily.sunrise[index],
        sunset: daily.sunset[index],
        uvIndexMax: daily.uv_index_max[index],
      })),
      hourly: hourly.time.map((time, index) => ({
        time,
        temperature: hourly.temperature_2m[index],
        weatherCode: hourly.weather_code[index],
        precipitationProbability: hourly.precipitation_probability[index],
        windSpeed: hourly.wind_speed_10m[index],
        humidity: hourly.relative_humidity_2m[index],
        visibility: hourly.visibility[index],
      })),
      city,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getWeatherByCity(city: City): Promise<WeatherData> {
    return this.getWeatherByCoordinates(city.lat, city.lon, city);
  }
}

export const weatherService = new WeatherService();