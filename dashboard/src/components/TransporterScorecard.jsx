import { useState, useMemo } from 'react';

function pct(num, den) {
  return den ? ((num / den) * 100).toFixed(1) : '0.0';
}

function CellColor({ value, thresholds }) {
  const num = parseFloat(value);
  let bg = '';
  if (num >= thresholds.good) bg = 'bg-emerald-50 text-emerald-700';
  else if (num >= thresholds.warn) bg = 'bg-amber-50 text-amber-700';
  else bg = 'bg-red-50 text-red-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${bg}`}>{value}%</span>;
}

export default function TransporterScorecard({ data }) {
  const [sortKey, setSortKey] = useState('otd');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    const mapped = data.map((d) => ({
      name: d.key,
      indents: d.indents,
      accepted: d.accepted,
      acceptPct: pct(d.accepted, d.indents),
      placed: d.placed,
      placePct: pct(d.placedOnTime, d.placed),
      trips: d.trips,
      otd: pct(d.onTime, d.trips),
    }));

    mapped.sort((a, b) => {
      const aVal = sortKey === 'name' ? a.name : parseFloat(a[sortKey]);
      const bVal = sortKey === 'name' ? b.name : parseFloat(b[sortKey]);
      if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return mapped;
  }, [data, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortHeader = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
    >
      {label}
      {sortKey === field && (
        <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>
      )}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortHeader label="Transporter" field="name" />
            <SortHeader label="Indents" field="indents" />
            <SortHeader label="Accepted" field="accepted" />
            <SortHeader label="Accept %" field="acceptPct" />
            <SortHeader label="Placed" field="placed" />
            <SortHeader label="Place OT %" field="placePct" />
            <SortHeader label="Trips" field="trips" />
            <SortHeader label="OTD %" field="otd" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="px-3 py-2.5 font-medium text-gray-800">{r.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.indents}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.accepted}</td>
              <td className="px-3 py-2.5">
                <CellColor value={r.acceptPct} thresholds={{ good: 80, warn: 60 }} />
              </td>
              <td className="px-3 py-2.5 text-gray-600">{r.placed}</td>
              <td className="px-3 py-2.5">
                <CellColor value={r.placePct} thresholds={{ good: 75, warn: 55 }} />
              </td>
              <td className="px-3 py-2.5 text-gray-600">{r.trips}</td>
              <td className="px-3 py-2.5">
                <CellColor value={r.otd} thresholds={{ good: 70, warn: 50 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
