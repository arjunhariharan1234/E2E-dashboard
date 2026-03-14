import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function RouteAnalysis({ data }) {
  const chartData = data
    .map((d) => ({
      name: d.key,
      'On Time': d.onTime,
      Late: d.late,
      total: d.onTime + d.late,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="On Time" stackId="a" fill="#1fa8c9" />
        <Bar dataKey="Late" stackId="a" fill="#ff5a5f" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
