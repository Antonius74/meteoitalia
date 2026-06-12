import { DailyHourly, HourlyForecast } from '@/types/weather';

export function groupHourlyByDay(hourly: HourlyForecast[]): DailyHourly[] {
  const map = new Map<string, HourlyForecast[]>();
  for (const hour of hourly) {
    const date = hour.time.split('T')[0];
    if (!date) continue;
    const list = map.get(date) ?? [];
    list.push(hour);
    map.set(date, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => ({
      date,
      dayOfWeek: new Date(date).toLocaleDateString('it-IT', { weekday: 'long' }),
      hours: hours.sort((a, b) => a.time.localeCompare(b.time)),
    }));
}
