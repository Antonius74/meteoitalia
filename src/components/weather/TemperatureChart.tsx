'use client';

import { WeatherData } from '@/types/weather';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TemperatureChartProps {
  hourly: WeatherData['hourly'];
}

export default function TemperatureChart({ hourly }: TemperatureChartProps) {
  const data = hourly.slice(0, 24).map((hour) => ({
    time: new Date(hour.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    temperature: Math.round(hour.temperature),
    humidity: hour.humidity,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
        Andamento Temperature
      </h2>
      
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              unit="°"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value) => [`${String(value)}°C`, 'Temperatura']}
            />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#tempGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}