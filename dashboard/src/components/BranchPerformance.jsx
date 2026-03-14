import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import FieldInfo from './FieldInfo';

export default function BranchPerformance({ data }) {
  const chartData = data
    .map((d) => ({
      name: d.key,
      'On Time': d.onTime,
      'Delayed': d.late,
      total: d.onTime + d.late,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
        <span>Grouped by</span>
        <FieldInfo field="branchName" />
        <span className="mx-1">|</span>
        <span>Metric:</span>
        <FieldInfo field="staBreach" />
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="On Time" stackId="a" fill="#1fa8c9" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Delayed" stackId="a" fill="#ff5a5f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
