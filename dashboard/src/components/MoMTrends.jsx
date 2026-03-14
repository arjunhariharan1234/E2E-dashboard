import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#1fa8c9', '#ff5a5f', '#6c5ce7', '#f39c12', '#2ecc71',
  '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#e67e22',
];

export default function MoMTrends({ data, months }) {
  const { chartData, transporters } = useMemo(() => {
    const transporterSet = new Set();
    const byMonth = {};

    for (const row of data) {
      transporterSet.add(row.transporterName);
      if (!byMonth[row.monthLabel]) byMonth[row.monthLabel] = { month: row.monthLabel };
      const otd = row.trips ? ((row.onTime / row.trips) * 100).toFixed(1) : 0;
      byMonth[row.monthLabel][row.transporterName] = parseFloat(otd);
    }

    const ordered = months.map((m) => byMonth[m.label] || { month: m.label });
    return { chartData: ordered, transporters: [...transporterSet].sort() };
  }, [data, months]);

  return (
    <ResponsiveContainer width="100%" height={360}>
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
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
