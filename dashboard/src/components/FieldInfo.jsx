import { useState, useRef, useEffect } from 'react';
import { FIELD_INFO } from '../data/generateData';

export default function FieldInfo({ field }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const info = FIELD_INFO[field];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!info) return null;

  return (
    <span className="relative inline-block ml-1" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-blue-100 text-gray-500 hover:text-blue-600 text-[9px] font-bold leading-none cursor-pointer transition-colors"
        title="Field info"
      >
        i
      </button>
      {open && (
        <div className="absolute z-[100] bottom-6 left-1/2 -translate-x-1/2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-left">
          <div className="text-xs font-bold text-gray-800 mb-1">{info.label}</div>
          <div className="flex items-center gap-1 mb-1.5">
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded">
              {info.column}
            </span>
            <span className="text-[10px] text-gray-400">DB Column</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed mb-1">{info.desc}</p>
          {info.formula && (
            <div className="mt-1.5 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded">
              <div className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-0.5">Formula</div>
              <code className="text-[10px] text-amber-900 break-all">{info.formula}</code>
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45" />
        </div>
      )}
    </span>
  );
}

export function FieldInfoInline({ field }) {
  const info = FIELD_INFO[field];
  if (!info) return null;

  return (
    <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-gray-800">{info.label}</span>
        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-mono rounded text-[10px]">{info.column}</span>
      </div>
      <p className="text-gray-500 text-[11px] leading-relaxed">{info.desc}</p>
      {info.formula && (
        <code className="block mt-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">{info.formula}</code>
      )}
    </div>
  );
}
