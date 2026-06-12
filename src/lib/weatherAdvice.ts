import { Poi, WeatherSuitability } from '@/types/poi';
import { getWeatherCondition } from './utils';

export interface WeatherContext {
  weatherCode: number;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  isDay?: boolean;
  month: number;
}

export interface PoiScore {
  poi: Poi;
  suitability: WeatherSuitability;
  score: number;
  reasons: string[];
}

function isHeavyWeather(code: number): boolean {
  const c = getWeatherCondition(code);
  return c === 'rain' || c === 'thunderstorm' || c === 'snow';
}

function isLightRain(code: number): boolean {
  return code >= 51 && code <= 67;
}

function isHot(t: number): boolean {
  return t >= 30;
}

function isCold(t: number): boolean {
  return t <= 5;
}

function isPleasant(t: number): boolean {
  return t >= 15 && t <= 26;
}

function scoreOutdoor(weather: WeatherContext): { weight: number; reasons: string[] } {
  const reasons: string[] = [];
  let weight = 1;

  if (isHeavyWeather(weather.weatherCode)) {
    weight = 0;
    reasons.push('Meteo avverso: meglio attività al chiuso.');
  } else if (isLightRain(weather.weatherCode)) {
    weight = 0.3;
    reasons.push('Pioggia leggera: attività outdoor possibili ma sconsigliate.');
  } else if (weather.precipitationProbability >= 70) {
    weight = 0.3;
    reasons.push(`Probabilità pioggia ${weather.precipitationProbability}%, meglio coprirsi.`);
  } else if (weather.precipitationProbability >= 40) {
    weight = 0.6;
    reasons.push('Probabilità pioggia moderata.');
  }

  if (isHot(weather.temperature)) {
    if (weight > 0) {
      weight *= 0.4;
      reasons.push(`Clima molto caldo (${Math.round(weather.temperature)}°C): preferire mattina/sera.`);
    }
  } else if (isCold(weather.temperature)) {
    weight *= 0.5;
    reasons.push(`Clima freddo (${Math.round(weather.temperature)}°C): coprirsi bene.`);
  } else if (isPleasant(weather.temperature)) {
    weight *= 1.2;
    reasons.push(`Temperatura piacevole (${Math.round(weather.temperature)}°C).`);
  }

  if (weather.windSpeed >= 50) {
    weight *= 0.5;
    reasons.push(`Vento forte (${Math.round(weather.windSpeed)} km/h).`);
  }

  return { weight, reasons };
}

function scoreIndoor(weather: WeatherContext): { weight: number; reasons: string[] } {
  const reasons: string[] = [];
  let weight = 0.8;

  if (isHeavyWeather(weather.weatherCode)) {
    weight = 1.4;
    reasons.push('Meteo avverso: perfetto per musei e luoghi coperti.');
  } else if (isLightRain(weather.weatherCode) || weather.precipitationProbability >= 70) {
    weight = 1.2;
    reasons.push('Probabile pioggia: meglio luoghi coperti.');
  }

  if (isHot(weather.temperature)) {
    weight = 1.3;
    reasons.push(`Caldo intenso (${Math.round(weather.temperature)}°C): l'aria condizionata è un sollievo.`);
  } else if (isCold(weather.temperature)) {
    weight = 1.3;
    reasons.push(`Freddo (${Math.round(weather.temperature)}°C): stare al chiuso è meglio.`);
  }

  return { weight, reasons };
}

function toSuitability(score: number): WeatherSuitability {
  if (score >= 1) return 'ottimo';
  if (score >= 0.7) return 'buono';
  if (score >= 0.3) return 'accettabile';
  return 'sconsigliato';
}

export function rankPois(pois: Poi[], weather: WeatherContext, limit = 4): PoiScore[] {
  const scored: PoiScore[] = pois.map((poi) => {
    const reasons: string[] = [];
    let baseScore = 0;

    if (poi.indoor) {
      const result = scoreIndoor(weather);
      baseScore = result.weight;
      reasons.push(...result.reasons);
    } else {
      const result = scoreOutdoor(weather);
      baseScore = result.weight;
      reasons.push(...result.reasons);
    }

    if (poi.bestMonths && poi.bestMonths.length > 0) {
      if (poi.bestMonths.includes(weather.month)) {
        baseScore *= 1.15;
        reasons.push('Stagione ideale.');
      } else {
        baseScore *= 0.85;
      }
    }

    if (poi.category === 'spiaggia' || poi.category === 'lago') {
      if (weather.temperature < 20) {
        baseScore *= 0.4;
        reasons.push('Mare/lago: temperatura non ideale per il bagno.');
      } else {
        baseScore *= 1.1;
        reasons.push('Meteo adatto per attività acquatiche.');
      }
    }

    if (poi.category === 'montagna' && isHeavyWeather(weather.weatherCode)) {
      baseScore = 0;
      reasons.push('Escursione in montagna sconsigliata con maltempo.');
    }

    return {
      poi,
      suitability: toSuitability(baseScore),
      score: baseScore,
      reasons: reasons.length > 0 ? reasons : ['Meteo neutro per questa attività.'],
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function summarizeWeather(weather: WeatherContext): string {
  const cond = getWeatherCondition(weather.weatherCode);
  const descr = (() => {
    switch (cond) {
      case 'clear':
        return 'Cielo sereno';
      case 'partly-cloudy':
        return 'Parzialmente nuvoloso';
      case 'cloudy':
        return 'Nuvoloso';
      case 'rain':
        return 'Pioggia';
      case 'drizzle':
        return 'Pioggerella';
      case 'thunderstorm':
        return 'Temporale';
      case 'snow':
        return 'Neve';
      case 'fog':
        return 'Nebbia';
      default:
        return 'Variabile';
    }
  })();

  if (isHot(weather.temperature)) return `${descr}, clima molto caldo (${Math.round(weather.temperature)}°C)`;
  if (isCold(weather.temperature)) return `${descr}, clima freddo (${Math.round(weather.temperature)}°C)`;
  return `${descr}, ${Math.round(weather.temperature)}°C`;
}
