import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1fa8c9', '#ff5a5f', '#6c5ce7', '#f39c12', '#2ecc71'];

export default function MoMTrends({ data, months }) {
  const { chartData, transporters } = useMemo(() => {
    // Aggregate total trips per transporter to find top 5
    const totals = {};
    for (const row of data) {
      if (!totals[row.transporterName]) totals[row.transporterName] = 0;
      totals[row.transporterName] += row.closed || 0;
    }
    const top5 = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const top5Set = new Set(top5);
    const byMonth = {};

    for (const row of data) {
      if (!top5Set.has(row.transporterName)) continue;
      if (!byMonth[row.monthLabel]) byMonth[row.monthLabel] = { month: row.monthLabel };
      const closed = row.closed || 0;
      const otd = closed ? ((row.onTime / closed) * 100).toFixed(1) : 0;
      byMonth[row.monthLabel][row.transporterName] = parseFloat(otd);
    }

    const ordered = months.map((m) => byMonth[m.label] || { month: m.label });
    return { chartData: ordered, transporters: top5 };
  }, [data, months]);

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(v) => `${v}%`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {transporters.map((t, i) => (
          <Line
            key={t}
            type="monotone"
            dataKey={t}
            stroke={COLORS[i]}
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
