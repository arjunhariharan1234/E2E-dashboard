import { useState, useMemo } from 'react';
import FieldInfo from './FieldInfo';

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

export default function BranchScorecard({ data }) {
  const [sortKey, setSortKey] = useState('otd');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    const mapped = data.map((d) => ({
      name: d.key,
      total: d.total,
      indents: d.hasIndent,
      acceptPct: pct(d.indentAccepted, d.hasIndent),
      otd: pct(d.onTime, d.closed),
      trackPct: pct(d.tracked, d.total),
      consentPct: pct(d.consentDone, d.total),
      epodPct: pct(d.epodSubmitted, d.total),
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

  const SortHeader = ({ label, field, fieldInfo }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
    >
      {label}
      {fieldInfo && <FieldInfo field={fieldInfo} />}
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
            <SortHeader label="Branch" field="name" fieldInfo="branchName" />
            <SortHeader label="Trips" field="total" fieldInfo="totalTrips" />
            <SortHeader label="Indents" field="indents" fieldInfo="hasIndent" />
            <SortHeader label="Accept %" field="acceptPct" fieldInfo="acceptanceRate" />
            <SortHeader label="OTD %" field="otd" fieldInfo="onTimeRate" />
            <SortHeader label="Tracking %" field="trackPct" fieldInfo="trackingRate" />
            <SortHeader label="Consent %" field="consentPct" fieldInfo="consentRate" />
            <SortHeader label="ePOD %" field="epodPct" fieldInfo="epodRate" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="px-3 py-2.5 font-medium text-gray-800 text-xs">{r.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.total}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.indents}</td>
              <td className="px-3 py-2.5">
                <CellColor value={r.acceptPct} thresholds={{ good: 80, warn: 60 }} />
              </td>
              <td className="px-3 py-2.5">
                <CellColor value={r.otd} thresholds={{ good: 80, warn: 60 }} />
              </td>
              <td className="px-3 py-2.5">
                <CellColor value={r.trackPct} thresholds={{ good: 85, warn: 70 }} />
              </td>
              <td className="px-3 py-2.5">
                <CellColor value={r.consentPct} thresholds={{ good: 70, warn: 50 }} />
              </td>
              <td className="px-3 py-2.5">
                <CellColor value={r.epodPct} thresholds={{ good: 50, warn: 30 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
