export interface WeatherCodeEntry {
  description: string;
  condition: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeEntry> = {
  0: { description: 'Cielo sereno', condition: 'clear' },
  1: { description: 'Prevalentemente sereno', condition: 'partly-cloudy' },
  2: { description: 'Parzialmente nuvoloso', condition: 'partly-cloudy' },
  3: { description: 'Nuvoloso', condition: 'cloudy' },
  45: { description: 'Nebbia', condition: 'fog' },
  48: { description: 'Nebbia con brina', condition: 'fog' },
  51: { description: 'Pioggerella leggera', condition: 'drizzle' },
  53: { description: 'Pioggerella moderata', condition: 'drizzle' },
  55: { description: 'Pioggerella intensa', condition: 'drizzle' },
  56: { description: 'Pioggerella gelata leggera', condition: 'drizzle' },
  57: { description: 'Pioggerella gelata intensa', condition: 'drizzle' },
  61: { description: 'Pioggia leggera', condition: 'rain' },
  63: { description: 'Pioggia moderata', condition: 'rain' },
  65: { description: 'Pioggia intensa', condition: 'rain' },
  66: { description: 'Pioggia gelata leggera', condition: 'rain' },
  67: { description: 'Pioggia gelata intensa', condition: 'rain' },
  71: { description: 'Nevicate leggere', condition: 'snow' },
  73: { description: 'Nevicate moderate', condition: 'snow' },
  75: { description: 'Nevicate intense', condition: 'snow' },
  77: { description: 'Granelli di neve', condition: 'snow' },
  80: { description: 'Rovesci leggeri', condition: 'rain' },
  81: { description: 'Rovesci moderati', condition: 'rain' },
  82: { description: 'Rovesci intensi', condition: 'rain' },
  85: { description: 'Nevicate leggere', condition: 'snow' },
  86: { description: 'Nevicate intense', condition: 'snow' },
  95: { description: 'Temporale', condition: 'thunderstorm' },
  96: { description: 'Temporale con grandine', condition: 'thunderstorm' },
  99: { description: 'Temporale con grandine', condition: 'thunderstorm' },
};
