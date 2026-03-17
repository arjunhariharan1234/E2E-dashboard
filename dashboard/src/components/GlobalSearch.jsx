import { useState, useMemo, useRef, useEffect } from 'react';

export default function GlobalSearch({ branches, transporters, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];
    for (const b of branches) {
      if (b.name.toLowerCase().includes(q)) matches.push({ type: 'branch', name: b.name });
    }
    for (const t of transporters) {
      if (t.name.toLowerCase().includes(q)) matches.push({ type: 'transporter', name: t.name });
    }
    return matches.slice(0, 10);
  }, [query, branches, transporters]);

  const handleSelect = (item) => {
    onSelect(item.type, item.name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search branch or transporter..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/15"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden">
          {results.map((item, i) => (
            <button
              key={`${item.type}-${item.name}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0"
            >
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                item.type === 'branch'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {item.type === 'branch' ? 'Branch' : 'Transporter'}
              </span>
              <span className="text-sm text-gray-800">{item.name}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] px-4 py-3 text-sm text-gray-500">
          No matching branch or transporter found
        </div>
      )}
    </div>
  );
}
