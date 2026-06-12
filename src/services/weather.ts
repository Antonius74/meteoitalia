import { WeatherData, City } from '@/types/weather';
import { API_BASE_URL, GEO_API_URL } from '@/lib/constants';

class WeatherService {
  private async fetchWithCache(url: string): Promise<any> {
    const response = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 2) return [];
    
    const url = `${GEO_API_URL}/search?name=${encodeURIComponent(query)}&count=10&language=it&format=json`;
    const data = await this.fetchWithCache(url);
    
    return (data.results || []).map((result: any) => ({
      name: result.name.toLowerCase(),
      displayName: result.name,
      region: result.admin1 || '',
      lat: result.latitude,
      lon: result.longitude,
      population: result.population,
    }));
  }

  async getWeatherByCoordinates(lat: number, lon: number, city: City): Promise<WeatherData> {
    const url = `${API_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=Europe/Rome&forecast_days=7`;
    
    const data = await this.fetchWithCache(url);
    
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    return {
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
        pressure: current.surface_pressure,
        feelsLike: current.apparent_temperature,
        uvIndex: 0, // Open-Meteo non fornisce UV in current, lo prenderemo dai daily
        visibility: current.visibility,
        precipitation: current.precipitation,
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0],
        isDay: current.is_day === 1,
      },
      daily: daily.time.map((date: string, index: number) => ({
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
      hourly: hourly.time.slice(0, 24).map((time: string, index: number) => ({
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