import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap,
} from 'recharts';

const pct = (n, d) => d ? parseFloat(((n / d) * 100).toFixed(1)) : 0;

// ── Color helpers ──
const COMPLIANCE_COLOR = (v) => {
  if (v >= 90) return '#059669';
  if (v >= 80) return '#34d399';
  if (v >= 70) return '#fbbf24';
  if (v >= 60) return '#f97316';
  return '#ef4444';
};

const PIE_COLORS = ['#1fa8c9', '#ff5a5f', '#f39c12', '#6c5ce7', '#2ecc71', '#e74c3c', '#9b59b6', '#3498db'];

// ────────────────────────────────────────────────────────────────────────
// 1. COMPLIANCE SCORECARD MATRIX
// ────────────────────────────────────────────────────────────────────────
function ComplianceMatrix({ data }) {
  const metrics = ['OTD %', 'Tracking %', 'Consent %', 'ePOD %', 'Indent Accept %'];

  const rows = useMemo(() => {
    const byBranch = {};
    for (const r of data) {
      if (!r.branchName) continue;
      if (!byBranch[r.branchName]) byBranch[r.branchName] = { total: 0, closed: 0, onTime: 0, tracked: 0, consent: 0, epod: 0, indent: 0, indentAcc: 0 };
      const b = byBranch[r.branchName];
      b.total++;
      if (r.tripStatus === 'Closed') b.closed++;
      if (r.onTime) b.onTime++;
      if (r.tracked) b.tracked++;
      if (r.consentDone) b.consent++;
      if (r.epodSubmitted) b.epod++;
      if (r.hasIndent) b.indent++;
      if (r.indentAccepted) b.indentAcc++;
    }

    return Object.entries(byBranch)
      .map(([name, b]) => ({
        name,
        values: {
          'OTD %': pct(b.onTime, b.closed),
          'Tracking %': pct(b.tracked, b.total),
          'Consent %': pct(b.consent, b.total),
          'ePOD %': pct(b.epod, b.total),
          'Indent Accept %': pct(b.indentAcc, b.indent),
        },
        total: b.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[200px] border-b border-gray-200">Branch</th>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-700 border-b border-gray-200">Trips</th>
              {metrics.map((m) => (
                <th key={m} className="px-3 py-2.5 text-center font-semibold text-gray-700 min-w-[90px] border-b border-gray-200">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-800 sticky left-0 bg-white text-[11px]">{row.name}</td>
                <td className="px-3 py-2 text-center text-gray-600 font-medium">{row.total}</td>
                {metrics.map((m) => {
                  const val = row.values[m];
                  return (
                    <td key={m} className="px-2 py-1.5">
                      <div
                        className="rounded-md text-center py-1.5 font-bold text-[11px] text-white"
                        style={{ backgroundColor: COMPLIANCE_COLOR(val) }}
                      >
                        {val}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 2. TRANSPORTER SLA BREACH REPORT
// ────────────────────────────────────────────────────────────────────────
function SLABreachReport({ data }) {
  const thresholds = { otd: 80, tracking: 85, consent: 70, epod: 50 };

  const breaches = useMemo(() => {
    const byT = {};
    for (const r of data) {
      if (!r.transporterName) continue;
      if (!byT[r.transporterName]) byT[r.transporterName] = { total: 0, closed: 0, onTime: 0, tracked: 0, consent: 0, epod: 0 };
      const t = byT[r.transporterName];
      t.total++;
      if (r.tripStatus === 'Closed') t.closed++;
      if (r.onTime) t.onTime++;
      if (r.tracked) t.tracked++;
      if (r.consentDone) t.consent++;
      if (r.epodSubmitted) t.epod++;
    }

    return Object.entries(byT)
      .map(([name, t]) => {
        const otd = pct(t.onTime, t.closed);
        const tracking = pct(t.tracked, t.total);
        const consent = pct(t.consent, t.total);
        const epod = pct(t.epod, t.total);
        const breachCount = (otd < thresholds.otd ? 1 : 0) + (tracking < thresholds.tracking ? 1 : 0) + (consent < thresholds.consent ? 1 : 0) + (epod < thresholds.epod ? 1 : 0);
        return { name, trips: t.total, otd, tracking, consent, epod, breachCount };
      })
      .filter((t) => t.breachCount > 0)
      .sort((a, b) => b.breachCount - a.breachCount || a.otd - b.otd);
  }, [data]);

  const Pill = ({ val, threshold }) => {
    const breached = val < threshold;
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${breached ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
        {val}%
        {breached && <span className="ml-1 text-[9px]">({threshold}% SLA)</span>}
      </span>
    );
  };

  return (
    <div>
      {breaches.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">All transporters meeting SLA thresholds.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Transporter</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Trips</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Breaches</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">OTD</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Tracking</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Consent</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">ePOD</th>
              </tr>
            </thead>
            <tbody>
              {breaches.map((t) => (
                <tr key={t.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800 text-xs">{t.name}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{t.trips}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{t.breachCount}</span>
                  </td>
                  <td className="px-3 py-2 text-center"><Pill val={t.otd} threshold={thresholds.otd} /></td>
                  <td className="px-3 py-2 text-center"><Pill val={t.tracking} threshold={thresholds.tracking} /></td>
                  <td className="px-3 py-2 text-center"><Pill val={t.consent} threshold={thresholds.consent} /></td>
                  <td className="px-3 py-2 text-center"><Pill val={t.epod} threshold={thresholds.epod} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 3. ePOD COMPLIANCE BREAKDOWN
// ────────────────────────────────────────────────────────────────────────
function EpodBreakdown({ data }) {
  const { statusData, bucketData } = useMemo(() => {
    const statusMap = {};
    const bucketMap = {};
    for (const r of data) {
      const s = r.epodStatus || 'Unknown';
      statusMap[s] = (statusMap[s] || 0) + 1;
      if (r.epodBucket) {
        bucketMap[r.epodBucket] = (bucketMap[r.epodBucket] || 0) + 1;
      }
    }
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    const bucketOrder = ['0-24 hrs', '24-48 hrs', '48-72 hrs', '>72 hrs'];
    const bucketData = bucketOrder.filter((b) => bucketMap[b]).map((name) => ({ name, value: bucketMap[name] }));
    return { statusData, bucketData };
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ePOD Status Distribution</h4>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.split(' ').slice(0, 2).join(' ')} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={9}>
              {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ePOD Submission Timeliness</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bucketData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="value" name="Trips" radius={[4, 4, 0, 0]}>
              {bucketData.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : i === 1 ? '#fbbf24' : i === 2 ? '#f97316' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 4. CLOSURE MODE ANALYSIS
// ────────────────────────────────────────────────────────────────────────
function ClosureModeAnalysis({ data }) {
  const chartData = useMemo(() => {
    const byBranch = {};
    for (const r of data) {
      if (!r.branchName || !r.modeOfClosure) continue;
      if (!byBranch[r.branchName]) byBranch[r.branchName] = { name: r.branchName, 'Auto Closed': 0, 'Auto Terminated': 0, 'Manual': 0 };
      const mode = r.modeOfClosure;
      if (byBranch[r.branchName][mode] !== undefined) byBranch[r.branchName][mode]++;
    }
    return Object.values(byBranch).sort((a, b) => (b['Auto Terminated'] + b['Auto Closed'] + b['Manual']) - (a['Auto Terminated'] + a['Auto Closed'] + a['Manual']));
  }, [data]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Auto Closed" stackId="a" fill="#059669" />
          <Bar dataKey="Auto Terminated" stackId="a" fill="#f97316" />
          <Bar dataKey="Manual" stackId="a" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 5. CONSIGNEE DELIVERY PERFORMANCE
// ────────────────────────────────────────────────────────────────────────
function ConsigneePerformance({ data }) {
  const rows = useMemo(() => {
    const map = {};
    for (const r of data) {
      if (!r.consigneeName || r.consigneeName === 'Unknown') continue;
      if (!map[r.consigneeName]) map[r.consigneeName] = { total: 0, closed: 0, onTime: 0, delayed: 0, tracked: 0, epod: 0 };
      const c = map[r.consigneeName];
      c.total++;
      if (r.tripStatus === 'Closed') c.closed++;
      if (r.onTime) c.onTime++;
      if (r.late) c.delayed++;
      if (r.tracked) c.tracked++;
      if (r.epodSubmitted) c.epod++;
    }
    return Object.entries(map)
      .map(([name, c]) => ({
        name,
        total: c.total,
        otd: pct(c.onTime, c.closed),
        delayed: c.delayed,
        trackPct: pct(c.tracked, c.total),
        epodPct: pct(c.epod, c.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [data]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 100 }} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-50} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="otd" name="OTD %" fill="#1fa8c9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="trackPct" name="Tracking %" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="epodPct" name="ePOD %" fill="#f39c12" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 6. BRANCH COMPLIANCE RADAR
// ────────────────────────────────────────────────────────────────────────
function BranchRadar({ data }) {
  const [selectedBranch, setSelectedBranch] = useState(null);

  const { branches, radarData } = useMemo(() => {
    const map = {};
    for (const r of data) {
      if (!r.branchName) continue;
      if (!map[r.branchName]) map[r.branchName] = { total: 0, closed: 0, onTime: 0, tracked: 0, consent: 0, epod: 0, indent: 0, indentAcc: 0 };
      const b = map[r.branchName];
      b.total++;
      if (r.tripStatus === 'Closed') b.closed++;
      if (r.onTime) b.onTime++;
      if (r.tracked) b.tracked++;
      if (r.consentDone) b.consent++;
      if (r.epodSubmitted) b.epod++;
      if (r.hasIndent) b.indent++;
      if (r.indentAccepted) b.indentAcc++;
    }

    const branches = Object.keys(map).sort();
    const metrics = ['OTD', 'Tracking', 'Consent', 'ePOD', 'Indent Accept'];
    const radarData = metrics.map((metric) => {
      const row = { metric };
      for (const [name, b] of Object.entries(map)) {
        if (metric === 'OTD') row[name] = pct(b.onTime, b.closed);
        else if (metric === 'Tracking') row[name] = pct(b.tracked, b.total);
        else if (metric === 'Consent') row[name] = pct(b.consent, b.total);
        else if (metric === 'ePOD') row[name] = pct(b.epod, b.total);
        else if (metric === 'Indent Accept') row[name] = pct(b.indentAcc, b.indent);
      }
      return row;
    });
    return { branches, radarData };
  }, [data]);

  const topBranches = useMemo(() => {
    if (selectedBranch) return [selectedBranch];
    return branches.slice(0, 4);
  }, [branches, selectedBranch]);

  const RADAR_COLORS = ['#1fa8c9', '#ff5a5f', '#6c5ce7', '#f39c12'];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setSelectedBranch(null)}
          className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${!selectedBranch ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
        >
          Top 4
        </button>
        {branches.map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBranch(b === selectedBranch ? null : b)}
            className={`px-3 py-1.5 text-xs rounded-md border transition cursor-pointer ${selectedBranch === b ? 'bg-[#1fa8c9] text-white border-[#1fa8c9]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
            {b}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
          {topBranches.map((b, i) => (
            <Radar key={b} name={b} dataKey={b} stroke={RADAR_COLORS[i % RADAR_COLORS.length]} fill={RADAR_COLORS[i % RADAR_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
          ))}
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => `${v}%`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 7. TRIP SOURCE ANALYSIS
// ────────────────────────────────────────────────────────────────────────
function TripSourceAnalysis({ data }) {
  const chartData = useMemo(() => {
    const map = {};
    for (const r of data) {
      const src = r.tripSource || 'Unknown';
      if (!map[src]) map[src] = { name: src, total: 0, onTime: 0, closed: 0 };
      map[src].total++;
      if (r.tripStatus === 'Closed') map[src].closed++;
      if (r.onTime) map[src].onTime++;
    }
    return Object.values(map)
      .map((s) => ({ ...s, otd: pct(s.onTime, s.closed) }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Volume by Source</h4>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.replace('V5-', '').replace('-', ' ')} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={9}>
              {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">OTD % by Source</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="otd" name="OTD %" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.otd >= 80 ? '#059669' : d.otd >= 70 ? '#fbbf24' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 8. TRACKING & CONSENT GAP ANALYSIS
// ────────────────────────────────────────────────────────────────────────
function TrackingConsentGap({ data }) {
  const chartData = useMemo(() => {
    const map = {};
    for (const r of data) {
      if (!r.branchName) continue;
      if (!map[r.branchName]) map[r.branchName] = { name: r.branchName, total: 0, tracked: 0, notTracked: 0, consent: 0, noConsent: 0 };
      const b = map[r.branchName];
      b.total++;
      if (r.tracked) b.tracked++; else b.notTracked++;
      if (r.consentDone) b.consent++; else b.noConsent++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tracking Coverage by Branch</h4>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-40} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="tracked" name="Tracked" stackId="a" fill="#059669" />
            <Bar dataKey="notTracked" name="Not Tracked" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Consent Coverage by Branch</h4>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-40} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="consent" name="Consent Done" stackId="a" fill="#059669" />
            <Bar dataKey="noConsent" name="No Consent" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 9. REPEAT DELAY OFFENDERS
// ────────────────────────────────────────────────────────────────────────
function RepeatDelayOffenders({ data }) {
  const rows = useMemo(() => {
    const map = {};
    for (const r of data) {
      if (!r.transporterName || !r.routeName) continue;
      const key = `${r.transporterName}|||${r.routeName}`;
      if (!map[key]) map[key] = { transporter: r.transporterName, route: r.routeName, total: 0, closed: 0, delayed: 0, onTime: 0 };
      const c = map[key];
      c.total++;
      if (r.tripStatus === 'Closed') c.closed++;
      if (r.late) c.delayed++;
      if (r.onTime) c.onTime++;
    }
    return Object.values(map)
      .filter((c) => c.delayed >= 2)
      .map((c) => ({ ...c, otd: pct(c.onTime, c.closed) }))
      .sort((a, b) => b.delayed - a.delayed)
      .slice(0, 15);
  }, [data]);

  return (
    <div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No repeat delay patterns detected.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Transporter</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Delayed</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">OTD %</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800 text-xs">{r.transporter}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{r.route}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{r.total}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-bold">{r.delayed}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.otd >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{r.otd}%</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.delayed >= 5 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">HIGH</span>
                    ) : r.delayed >= 3 ? (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">MEDIUM</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold">LOW</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 10. SUPERSET AUTOMATION & ALERTS CONFIG
// ────────────────────────────────────────────────────────────────────────
function AlertsConfig() {
  const alerts = [
    { name: 'OTD Below 75%', trigger: 'Daily at 9 AM', condition: 'OTD Rate < 75% for any branch', action: 'Email to Branch Head + Slack #ops-alerts', severity: 'Critical' },
    { name: 'ePOD Backlog > 50', trigger: 'Daily at 6 PM', condition: 'PENDING_SUBMISSION count > 50', action: 'Email to ePOD compliance team', severity: 'Warning' },
    { name: 'Tracking Drop', trigger: 'Every 4 hours', condition: 'Tracking Rate < 80% for any transporter', action: 'Slack notification to transporter manager', severity: 'Warning' },
    { name: 'Consent Not Done', trigger: 'On trip creation', condition: 'consent_status = "Not Done" after 2 hours', action: 'Auto-escalation email to transporter', severity: 'Info' },
    { name: 'Auto Terminated Spike', trigger: 'Daily at 7 AM', condition: 'Auto Terminated > 30% of closures for a branch', action: 'Email to logistics head', severity: 'Critical' },
    { name: 'Weekly MoM Report', trigger: 'Every Monday 8 AM', condition: 'Scheduled — no condition', action: 'PDF report to leadership distribution list', severity: 'Info' },
    { name: 'Monthly Compliance Pack', trigger: '1st of every month', condition: 'Scheduled — no condition', action: 'Full dashboard PDF + CSV export to management', severity: 'Info' },
    { name: 'Transporter SLA Breach', trigger: 'Weekly Friday 5 PM', condition: 'Any transporter below SLA on 2+ metrics', action: 'Summary email to procurement + SCM head', severity: 'Critical' },
  ];

  const sevColors = { Critical: 'bg-red-50 text-red-700', Warning: 'bg-amber-50 text-amber-700', Info: 'bg-blue-50 text-blue-700' };

  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Alert Name</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Trigger</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Condition</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Severity</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.name} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-800 text-xs">{a.name}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{a.trigger}</td>
                <td className="px-3 py-2.5 text-gray-600 text-[11px]">{a.condition}</td>
                <td className="px-3 py-2.5 text-gray-600 text-[11px]">{a.action}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sevColors[a.severity]}`}>{a.severity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 11. PRE-BUILT SQL LAB QUERIES
// ────────────────────────────────────────────────────────────────────────
function SQLLabQueries() {
  const queries = [
    {
      name: 'Monthly Compliance Summary',
      purpose: 'Single-view MoM comparison of all KPIs across branches for the compliance meeting',
      sql: `SELECT
  branch_name,
  TO_CHAR(created_at, 'Mon YYYY') AS month,
  COUNT(*) AS total_trips,
  ROUND(SUM(CASE WHEN sta_breached = 0 AND trip_status = 'Closed' THEN 1 ELSE 0 END)::numeric
    / NULLIF(SUM(CASE WHEN trip_status = 'Closed' THEN 1 ELSE 0 END), 0) * 100, 1) AS otd_pct,
  ROUND(SUM(CASE WHEN tracking_status = 'Tracked' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) AS tracking_pct,
  ROUND(SUM(CASE WHEN consent_status = 'Accepted' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) AS consent_pct,
  ROUND(SUM(CASE WHEN epod_status = 'VERIFIED_AS_SUCCESSFULLY_DELIVERED' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) AS epod_pct
FROM trips_master
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
GROUP BY 1, 2 ORDER BY 2, 1;`,
    },
    {
      name: 'Delayed Trips Deep Dive',
      purpose: 'List all delayed trips with transporter, route, delay hours, and mode of closure for root cause analysis',
      sql: `SELECT
  trip_id, vehicle_number, transporter_name, branch_name,
  routename, consignee_name, origin_city, destination_city,
  ROUND(transit_time - initial_eta, 1) AS delay_hours,
  mode_of_closure, epod_status, tracking_status
FROM trips_master
WHERE sta_breached = 1 AND trip_status = 'Closed'
  AND created_at >= '{{ from_dttm }}'
ORDER BY delay_hours DESC;`,
    },
    {
      name: 'Transporter vs Route Performance Matrix',
      purpose: 'Cross-tab of transporter × route showing OTD % for identifying weak transporter-route pairings',
      sql: `SELECT
  transporter_name, routename,
  COUNT(*) AS trips,
  ROUND(SUM(CASE WHEN sta_breached = 0 THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) AS otd_pct,
  SUM(CASE WHEN sta_breached = 1 THEN 1 ELSE 0 END) AS delayed_count
FROM trips_master
WHERE trip_status = 'Closed' AND routename IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) >= 3
ORDER BY otd_pct ASC;`,
    },
    {
      name: 'ePOD Aging Report',
      purpose: 'Trips with pending ePOD submission for follow-up in compliance meeting',
      sql: `SELECT
  trip_id, vehicle_number, transporter_name, branch_name,
  consignee_name, created_at,
  EXTRACT(DAY FROM NOW() - created_at) AS days_since_trip,
  epod_status
FROM trips_master
WHERE epod_status = 'PENDING_SUBMISSION'
  AND trip_status = 'Closed'
ORDER BY created_at ASC;`,
    },
    {
      name: 'Auto Terminated Investigation',
      purpose: 'Trips that timed out instead of reaching destination — indicates tracking/operational issues',
      sql: `SELECT
  trip_id, branch_name, transporter_name, routename,
  vehicle_number, distance_travelled,
  trip_duration_in_hours AS max_allowed_hrs,
  transit_time AS actual_transit_hrs,
  tracking_status, consent_status
FROM trips_master
WHERE mode_of_closure = 'Auto Terminated'
  AND created_at >= '{{ from_dttm }}'
ORDER BY created_at DESC;`,
    },
  ];

  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      {queries.map((q, i) => (
        <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-gray-800">{q.name}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{q.purpose}</div>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded === i && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <pre className="bg-gray-900 text-green-400 text-[11px] p-4 rounded-lg overflow-x-auto leading-relaxed">{q.sql}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN ADVANCED VIEWS COMPONENT
// ────────────────────────────────────────────────────────────────────────
const VIEW_SECTIONS = [
  {
    id: 'compliance',
    title: 'Branch Compliance Scorecard',
    subtitle: 'All KPIs in one heatmap view — identify which branches need attention across OTD, Tracking, Consent, ePOD, and Indent Acceptance.',
    superset: 'Pivot Table with Conditional Formatting + Cross-filter on row click',
    Component: ComplianceMatrix,
  },
  {
    id: 'sla',
    title: 'Transporter SLA Breach Report',
    subtitle: 'Transporters breaching any SLA threshold — bring to the compliance meeting for corrective action or contract review.',
    superset: 'Table Chart with Conditional Formatting + Scheduled Alert when breach count > 0',
    Component: SLABreachReport,
  },
  {
    id: 'radar',
    title: 'Branch Comparison Radar',
    subtitle: 'Compare branches across all 5 compliance dimensions simultaneously. Select specific branches to compare.',
    superset: 'Radar Chart (ECharts) + Native Filter for branch selection',
    Component: BranchRadar,
  },
  {
    id: 'epod',
    title: 'ePOD Compliance Breakdown',
    subtitle: 'Understand ePOD submission status and timeliness. >72 hrs bucket is the escalation priority.',
    superset: 'Pie Chart + Bar Chart with Time Grain toggle (daily → weekly → monthly)',
    Component: EpodBreakdown,
  },
  {
    id: 'closure',
    title: 'Trip Closure Mode Analysis',
    subtitle: 'High "Auto Terminated" indicates trips timing out without reaching destination — investigate tracking gaps or unrealistic ETAs.',
    superset: 'Stacked Bar (ECharts) + Drill-down to individual terminated trips',
    Component: ClosureModeAnalysis,
  },
  {
    id: 'consignee',
    title: 'Consignee Delivery Performance',
    subtitle: 'How well are you serving each customer? Identify at-risk customer relationships before they escalate.',
    superset: 'Grouped Bar Chart + Cross-filter to Trip Detail table for any consignee',
    Component: ConsigneePerformance,
  },
  {
    id: 'gap',
    title: 'Tracking & Consent Gap Analysis',
    subtitle: 'Branch-wise gaps in GPS tracking and driver consent. Non-tracked trips cannot be monitored for STA compliance.',
    superset: 'Stacked Bar Charts + Alert when tracking drops below 80% for any branch',
    Component: TrackingConsentGap,
  },
  {
    id: 'offenders',
    title: 'Repeat Delay Offenders',
    subtitle: 'Transporter × Route combinations with recurring delays. Flag for route reassignment or transporter review.',
    superset: 'Table with Row-level Conditional Formatting + Annotation markers on MoM trend lines',
    Component: RepeatDelayOffenders,
  },
  {
    id: 'source',
    title: 'Trip Creation Source Analysis',
    subtitle: 'Compare OTD across Integration, Roundtrip, and Manual trips. Manual trips may lack proper ETA setup.',
    superset: 'Pie Chart + Grouped Bar + Cross-filter by source type',
    Component: TripSourceAnalysis,
  },
  {
    id: 'alerts',
    title: 'Scheduled Alerts & Reports',
    subtitle: 'Pre-configured alerts and automated reports that Superset can trigger for proactive compliance management.',
    superset: 'Superset Alerts & Reports module — email/Slack with PDF or CSV attachments',
    Component: AlertsConfig,
  },
  {
    id: 'sql',
    title: 'SQL Lab — Pre-built Queries',
    subtitle: 'Ready-to-use SQL queries for ad-hoc deep dives during or after the compliance meeting.',
    superset: 'SQL Lab with saved queries + Virtual Dataset creation from any query result',
    Component: SQLLabQueries,
  },
];

export default function AdvancedViews({ data }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-xl p-5 text-white mb-6">
        <h3 className="text-lg font-semibold mb-1">Operations Compliance Meeting Views</h3>
        <p className="text-sm text-blue-200 leading-relaxed">
          These views are designed for the monthly compliance review. Each section shows the analysis possible with Apache Superset and the specific Superset feature that powers it.
          On production, every chart supports cross-filtering, drill-down, scheduled PDF/email reports, threshold-based alerts, and Row-Level Security per branch.
        </p>
      </div>

      {VIEW_SECTIONS.map(({ id, title, subtitle, superset, Component }) => (
        <div key={id} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded">Superset</span>
              <span className="text-[10px] text-gray-400">{superset}</span>
            </div>
          </div>
          <div className="p-4">
            <Component data={data} />
          </div>
        </div>
      ))}
    </div>
  );
}
