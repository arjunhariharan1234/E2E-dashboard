import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FIELD_INFO } from '../data/generateData';

export default function FieldInfo({ field }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const info = FIELD_INFO[field];

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popH = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openBelow = spaceBelow > popH;
    setPos({
      top: openBelow ? rect.bottom + 6 : rect.top - popH - 6,
      left: Math.max(8, Math.min(rect.left - 120, window.innerWidth - 300)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, updatePos]);

  if (!info) return null;

  return (
    <span className="relative inline-block ml-1">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-blue-100 text-gray-500 hover:text-blue-600 text-[9px] font-bold leading-none cursor-pointer transition-colors"
        title="Field info"
      >
        i
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-2xl p-3 text-left"
          style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
        >
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
        </div>,
        document.body
      )}
    </span>
  );
}
