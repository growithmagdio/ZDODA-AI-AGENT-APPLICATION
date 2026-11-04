import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface SeriesPoint {
  date: string;
  total: number;
}

const short = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Single-series daily volume. One axis, thin rounded bars, recessive grid, hover tooltip. */
export const VolumeChart: React.FC<{ data: SeriesPoint[]; height?: number; label?: string }> = ({ data, height = 260, label = 'Conversations' }) => (
  <div style={{ height }} role="img" aria-label={`${label} per day: ${data.map((d) => `${short(d.date)} ${d.total}`).join(', ')}`}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap={data.length > 40 ? 1 : 3}>
        <CartesianGrid vertical={false} stroke="var(--separator)" />
        <XAxis dataKey="date" tickFormatter={short} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          cursor={{ fill: 'var(--surface-2)' }}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--separator)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' }}
          labelFormatter={(d) => short(String(d))}
          formatter={(v) => [v as number, label]}
        />
        <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
