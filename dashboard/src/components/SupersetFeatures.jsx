const FEATURES = [
  {
    title: 'Native Filter Panel',
    desc: 'Persistent sidebar with cascading filters for Date Range, Branch, Transporter, Route, Consignee. Filters auto-scope to all charts on the dashboard. Supports multi-select, search, and dependent filtering.',
    tag: 'Interactive',
  },
  {
    title: 'Cross-filter Drill Down',
    desc: 'Click any bar/segment in a chart to automatically filter all other charts. E.g., click "Sholinghur - HVBU" in the Branch chart → Transporter table, Route chart, and Trends all filter to that branch.',
    tag: 'Interactive',
  },
  {
    title: 'Time Grain Controls',
    desc: 'Toggle between daily, weekly, monthly, and quarterly aggregations on any time-series chart. Superset recalculates KPIs dynamically without new queries.',
    tag: 'Interactive',
  },
  {
    title: 'SQL Lab / Ad-hoc Queries',
    desc: 'Write custom SQL directly against the database. Join trip, indent, and ePOD tables for any custom analysis not covered by the pre-built charts.',
    tag: 'Advanced',
  },
  {
    title: 'Dashboard-level URL Params',
    desc: 'Bookmark specific filter states as URL parameters. Share filtered views (e.g., "only Pune branches, last 3 months") via link.',
    tag: 'Sharing',
  },
  {
    title: 'Scheduled Reports & Alerts',
    desc: 'Schedule automated email/Slack reports (daily/weekly/monthly). Set threshold alerts — e.g., notify when OTD drops below 70% or a branch STA breach exceeds 25%.',
    tag: 'Automation',
  },
  {
    title: 'Row-Level Security (RLS)',
    desc: 'Restrict data visibility by branch or transporter. Branch managers see only their branch data. Transporters see only their own performance.',
    tag: 'Security',
  },
  {
    title: 'Embedded Analytics',
    desc: 'Embed the full dashboard or individual charts into your internal portal or ERP via iframe with JWT authentication. No separate Superset login required.',
    tag: 'Integration',
  },
  {
    title: 'Materialized Views',
    desc: 'Pre-aggregate heavy queries into materialized views (mv_lifecycle_summary) for sub-second dashboard load even on millions of rows.',
    tag: 'Performance',
  },
  {
    title: 'Chart Annotations',
    desc: 'Add event annotations (e.g., "new transporter onboarded", "festive season") as overlay lines on time-series charts for context.',
    tag: 'Advanced',
  },
  {
    title: 'Export & Download',
    desc: 'Export any chart data as CSV/Excel. Export entire dashboard as PDF. Schedule recurring CSV exports to email.',
    tag: 'Sharing',
  },
  {
    title: 'Real-time Refresh',
    desc: 'Configure auto-refresh intervals (30s, 1m, 5m) for live monitoring. The underlying PostgreSQL data is updated via FourKites integration feeds.',
    tag: 'Performance',
  },
];

const TAG_COLORS = {
  Interactive: 'bg-blue-50 text-blue-700',
  Advanced: 'bg-purple-50 text-purple-700',
  Sharing: 'bg-green-50 text-green-700',
  Automation: 'bg-amber-50 text-amber-700',
  Security: 'bg-red-50 text-red-700',
  Integration: 'bg-cyan-50 text-cyan-700',
  Performance: 'bg-indigo-50 text-indigo-700',
};

export default function SupersetFeatures() {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        When deployed on Apache Superset, the following capabilities will be available beyond this POC view.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-semibold text-gray-800">{f.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${TAG_COLORS[f.tag]}`}>
                {f.tag}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
