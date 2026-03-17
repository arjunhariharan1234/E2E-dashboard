import { useState } from 'react';
import FieldInfo from './FieldInfo';

const BUSINESS_UNITS = [
  { key: 'HVBU', label: 'HVBU', desc: 'Heavy Vehicle Business Unit' },
  { key: 'LVBU', label: 'LVBU', desc: 'Light Vehicle Business Unit' },
];

export default function Filters({ filters, onChange, branches, transporters, months }) {
  const [open, setOpen] = useState(false);

  const toggle = (field, value) => {
    const current = filters[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  };

  const toggleMonth = (key) => {
    const current = filters.months;
    const next = current.includes(key)
      ? current.filter((v) => v !== key)
      : [...current, key];
    onChange({ ...filters, months: next });
  };

  const setBusinessUnit = (key) => {
    onChange({ ...filters, businessUnit: filters.businessUnit === key ? '' : key });
  };

  const clearAll = () => {
    onChange({
      months: months.map((m) => m.key),
      businessUnit: '',
      branches: [],
      transporters: [],
    });
  };

  const hasFilters = filters.branches.length > 0 || filters.transporters.length > 0 || filters.months.length !== months.length || !!filters.businessUnit;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasFilters && (
            <span className="bg-[#1e3a5f] text-white text-xs px-2 py-0.5 rounded-full">Active</span>
          )}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Month filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1.5">
                {months.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => toggleMonth(m.key)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${
                      filters.months.includes(m.key)
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Unit filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                Business Unit
                <FieldInfo field="businessUnit" />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BUSINESS_UNITS.map((bu) => (
                  <button
                    key={bu.key}
                    onClick={() => setBusinessUnit(bu.key)}
                    title={bu.desc}
                    className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${
                      filters.businessUnit === bu.key
                        ? 'bg-[#e67e22] text-white border-[#e67e22]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {bu.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Branch
              </label>
              <div className="flex flex-wrap gap-1.5">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => toggle('branches', b.name)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${
                      filters.branches.includes(b.name)
                        ? 'bg-[#1fa8c9] text-white border-[#1fa8c9]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Transporter filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Transporter
              </label>
              <div className="flex flex-wrap gap-1.5">
                {transporters.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggle('transporters', t.name)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${
                      filters.transporters.includes(t.name)
                        ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="mt-3 text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
