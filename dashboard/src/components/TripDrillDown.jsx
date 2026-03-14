import { useState, useMemo } from 'react';
import { DELAY_BUCKETS } from '../data/generateData';

const BUCKET_COLORS = {
  'On Time': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', activeBg: 'bg-emerald-600' },
  '0-2h':   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-300',   activeBg: 'bg-amber-500' },
  '2-6h':   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-300',  activeBg: 'bg-orange-500' },
  '6-12h':  { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-300',     activeBg: 'bg-red-500' },
  '12-24h': { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-400',     activeBg: 'bg-red-600' },
  '24h+':   { bg: 'bg-red-100',    text: 'text-red-800',     border: 'border-red-500',     activeBg: 'bg-red-700' },
};

export default function TripDrillDown({ data }) {
  const [search, setSearch] = useState('');
  const [activeBuckets, setActiveBuckets] = useState([]);
  const [sortKey, setSortKey] = useState('delayMinutes');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const bucketCounts = useMemo(() => {
    const counts = {};
    for (const b of DELAY_BUCKETS) counts[b] = 0;
    for (const r of data) counts[r.delayBucket]++;
    return counts;
  }, [data]);

  const toggleBucket = (bucket) => {
    setActiveBuckets((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]
    );
    setPage(0);
  };

  const clearBuckets = () => {
    setActiveBuckets([]);
    setPage(0);
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    let rows = data;

    if (activeBuckets.length > 0) {
      rows = rows.filter((r) => activeBuckets.includes(r.delayBucket));
    }

    if (s) {
      rows = rows.filter(
        (r) =>
          r.tripId.toLowerCase().includes(s) ||
          r.transporter.toLowerCase().includes(s) ||
          r.branch.toLowerCase().includes(s) ||
          r.route.toLowerCase().includes(s)
      );
    }

    rows = [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return rows;
  }, [data, search, activeBuckets, sortKey, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      {sortKey === field && <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>}
    </th>
  );

  function formatDelayHours(delayHours) {
    if (delayHours === null || delayHours <= 0) return '-';
    if (delayHours < 1) return `${Math.round(delayHours * 60)}m`;
    return `${delayHours}h`;
  }

  return (
    <div>
      {/* Delay bucket filters */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delay Buckets</span>
          {activeBuckets.length > 0 && (
            <button onClick={clearBuckets} className="text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer">
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {DELAY_BUCKETS.map((bucket) => {
            const isActive = activeBuckets.includes(bucket);
            const colors = BUCKET_COLORS[bucket];
            const count = bucketCounts[bucket];
            return (
              <button
                key={bucket}
                onClick={() => toggleBucket(bucket)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? `${colors.activeBg} text-white border-transparent shadow-sm`
                    : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm`
                }`}
              >
                <span>{bucket}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/25' : 'bg-white/80'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          placeholder="Search trips, transporter, branch, route..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">{filtered.length} trips</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHeader label="Trip ID" field="tripId" />
              <SortHeader label="Vehicle" field="vehicleId" />
              <SortHeader label="Transporter" field="transporter" />
              <SortHeader label="Branch" field="branch" />
              <SortHeader label="Route" field="route" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Delay (hrs)" field="delayMinutes" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Bucket</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((r) => {
              const colors = BUCKET_COLORS[r.delayBucket];
              return (
                <tr key={r.tripId} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.tripId}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.vehicleId}</td>
                  <td className="px-3 py-2 text-gray-700">{r.transporter}</td>
                  <td className="px-3 py-2 text-gray-600">{r.branch}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{r.route}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === 'On Time'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.delayHours > 0 ? (
                      <span className="text-red-600 font-semibold">{formatDelayHours(r.delayHours)}</span>
                    ) : (
                      <span className="text-emerald-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
                      {r.delayBucket}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
