import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function TransporterFulfilment({ data }) {
  const chartData = data
    .map((d) => ({
      name: d.key,
      Accepted: d.accepted,
      'Not Accepted': d.indents - d.accepted,
    }))
    .sort((a, b) => b.Accepted - a.Accepted);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Accepted" fill="#1fa8c9" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Not Accepted" fill="#ff5a5f" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
