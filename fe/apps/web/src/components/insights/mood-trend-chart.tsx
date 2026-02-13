'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { TrendPoint } from '@lifespan/api';

interface MoodTrendChartProps {
  data: TrendPoint[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function MoodTrendChart({ data }: MoodTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-edge, #e5e7eb)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'var(--color-content-tertiary, #9ca3af)' }}
          axisLine={{ stroke: 'var(--color-edge, #e5e7eb)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 11, fill: 'var(--color-content-tertiary, #9ca3af)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface-card, #fff)',
            border: '1px solid var(--color-edge, #e5e7eb)',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(value) => [Number(value).toFixed(1), 'Score']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-accent, #3b82f6)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-accent, #3b82f6)' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
