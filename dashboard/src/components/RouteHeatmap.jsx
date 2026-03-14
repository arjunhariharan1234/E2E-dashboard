import { useMemo } from 'react';

function getColor(value) {
  if (value === null || value === undefined) return '#f3f4f6';
  if (value >= 90) return '#059669';
  if (value >= 80) return '#34d399';
  if (value >= 70) return '#fbbf24';
  if (value >= 60) return '#f97316';
  return '#ef4444';
}

export default function RouteHeatmap({ data, months }) {
  const { routes, grid } = useMemo(() => {
    const routeSet = new Set();
    const map = {};

    for (const row of data) {
      routeSet.add(row.routeName);
      const key = `${row.routeName}||${row.monthLabel}`;
      if (!map[key]) map[key] = { onTime: 0, closed: 0 };
      map[key].onTime += row.onTime;
      map[key].closed += row.closed;
    }

    const routeList = [...routeSet].sort();
    const grid = {};
    for (const route of routeList) {
      grid[route] = {};
      for (const m of months) {
        const key = `${route}||${m.label}`;
        const d = map[key];
        grid[route][m.label] = d && d.closed ? parseFloat(((d.onTime / d.closed) * 100).toFixed(0)) : null;
      }
    }

    return { routes: routeList, grid };
  }, [data, months]);

  return (
    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="px-2 py-2 text-left font-semibold text-gray-600 sticky left-0 bg-white">Route</th>
            {months.map((m) => (
              <th key={m.key} className="px-2 py-2 text-center font-semibold text-gray-600 min-w-[60px]">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route}>
              <td className="px-2 py-1.5 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white text-[10px]">
                {route}
              </td>
              {months.map((m) => {
                const val = grid[route][m.label];
                return (
                  <td key={m.key} className="px-1 py-1">
                    <div
                      className="rounded text-center py-1.5 text-white font-bold text-[10px]"
                      style={{ backgroundColor: getColor(val) }}
                    >
                      {val !== null ? `${val}%` : '-'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
