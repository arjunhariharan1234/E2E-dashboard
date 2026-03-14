import { useMemo } from 'react';

function getColor(value) {
  if (value === null || value === undefined) return '#e5e7eb';
  if (value >= 90) return '#059669';
  if (value >= 80) return '#34d399';
  if (value >= 70) return '#fbbf24';
  if (value >= 60) return '#f97316';
  return '#ef4444';
}

function getTextColor(value) {
  if (value === null || value === undefined) return '#9ca3af';
  return '#fff';
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
    <div className="overflow-auto" style={{ maxHeight: '600px' }}>
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50">
            <th className="px-3 py-2.5 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[220px] border-b border-gray-200">
              Route
            </th>
            {months.map((m) => (
              <th key={m.key} className="px-2 py-2.5 text-center font-semibold text-gray-700 min-w-[80px] border-b border-gray-200">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white text-[11px]">
                {route}
              </td>
              {months.map((m) => {
                const val = grid[route][m.label];
                return (
                  <td key={m.key} className="px-1.5 py-1.5">
                    <div
                      className="rounded-md text-center py-2 font-bold text-[11px] min-h-[32px] flex items-center justify-center"
                      style={{
                        backgroundColor: getColor(val),
                        color: getTextColor(val),
                      }}
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
