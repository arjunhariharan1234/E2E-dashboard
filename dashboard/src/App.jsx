import { useState, useMemo } from 'react';
import {
  generateDataset,
  getKPIs,
  aggregateByField,
  aggregateByTwoFields,
  getTripDetails,
  BRANCHES,
  TRANSPORTERS,
  MONTHS,
} from './data/generateData';
import KPICard from './components/KPICard';
import BranchPerformance from './components/BranchPerformance';
import TransporterScorecard from './components/TransporterScorecard';
import TransporterFulfilment from './components/TransporterFulfilment';
import RouteAnalysis from './components/RouteAnalysis';
import MoMTrends from './components/MoMTrends';
import RouteHeatmap from './components/RouteHeatmap';
import TripDrillDown from './components/TripDrillDown';
import Filters from './components/Filters';

const ALL_DATA = generateDataset();

export default function App() {
  const [filters, setFilters] = useState({
    months: MONTHS.map((m) => m.key),
    branches: [],
    transporters: [],
  });
  const [activeSection, setActiveSection] = useState('overview');

  const filtered = useMemo(() => {
    return ALL_DATA.filter((r) => {
      if (!filters.months.includes(r.month)) return false;
      if (filters.branches.length && !filters.branches.includes(r.branchName)) return false;
      if (filters.transporters.length && !filters.transporters.includes(r.transporterName))
        return false;
      return true;
    });
  }, [filters]);

  const kpis = useMemo(() => getKPIs(filtered), [filtered]);
  const branchData = useMemo(() => aggregateByField(filtered, 'branchName'), [filtered]);
  const transporterData = useMemo(() => aggregateByField(filtered, 'transporterName'), [filtered]);
  const routeData = useMemo(() => aggregateByField(filtered, 'routeName'), [filtered]);
  const momData = useMemo(
    () => aggregateByTwoFields(filtered, 'monthLabel', 'transporterName'),
    [filtered]
  );
  const routeMomData = useMemo(
    () => aggregateByTwoFields(filtered, 'monthLabel', 'routeName'),
    [filtered]
  );
  const tripDetails = useMemo(() => getTripDetails(filtered), [filtered]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'branch', label: 'Branch' },
    { id: 'transporter', label: 'Transporter' },
    { id: 'routes', label: 'Routes' },
    { id: 'trends', label: 'MoM Trends' },
    { id: 'drilldown', label: 'Trip Details' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="bg-[#1e3a5f] text-white px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              End to End Lifecycle Dashboard
            </h1>
            <p className="text-sm text-blue-200 mt-0.5">
              Branch & Transporter Performance &mdash; Shipment Lifecycle
            </p>
          </div>
          <div className="text-xs text-blue-300 text-right">
            <div>POC Dashboard</div>
            <div>Data: Oct 2025 &mdash; Feb 2026</div>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 py-4">
        <Filters
          filters={filters}
          onChange={setFilters}
          branches={BRANCHES}
          transporters={TRANSPORTERS}
          months={MONTHS}
        />

        <nav className="flex gap-1 mb-4 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeSection === s.id
                  ? 'bg-[#1e3a5f] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <KPICard label="Total Indents" value={kpis.totalIndents.toLocaleString()} color="#1e3a5f" />
          <KPICard label="Acceptance Rate" value={`${kpis.acceptanceRate}%`} color="#1fa8c9" target={80} actual={parseFloat(kpis.acceptanceRate)} />
          <KPICard label="Vehicles Placed" value={kpis.vehiclesPlaced.toLocaleString()} color="#6c5ce7" />
          <KPICard label="Placement On Time" value={`${kpis.placementRate}%`} color="#f39c12" target={75} actual={parseFloat(kpis.placementRate)} />
          <KPICard label="Total Trips" value={kpis.totalTrips.toLocaleString()} color="#1e3a5f" />
          <KPICard label="OTD Rate" value={`${kpis.otdRate}%`} color="#2ecc71" target={70} actual={parseFloat(kpis.otdRate)} />
        </div>

        {(activeSection === 'overview' || activeSection === 'branch') && (
          <Section title="Branch Performance &mdash; Delivery Compliance">
            <BranchPerformance data={branchData} />
          </Section>
        )}

        {(activeSection === 'overview' || activeSection === 'transporter') && (
          <>
            <Section title="Transporter Performance Scorecard">
              <TransporterScorecard data={transporterData} />
            </Section>
            <Section title="Transporter Indent Fulfilment">
              <TransporterFulfilment data={transporterData} />
            </Section>
          </>
        )}

        {(activeSection === 'overview' || activeSection === 'routes') && (
          <Section title="Route Level &mdash; On Time vs Late">
            <RouteAnalysis data={routeData} />
          </Section>
        )}

        {(activeSection === 'overview' || activeSection === 'trends') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Section title="MoM Transporter Performance">
              <MoMTrends data={momData} months={MONTHS} />
            </Section>
            <Section title="Route OTD % &mdash; Monthly Heatmap">
              <RouteHeatmap data={routeMomData} months={MONTHS} />
            </Section>
          </div>
        )}

        {(activeSection === 'overview' || activeSection === 'drilldown') && (
          <Section title="Trip Detail Drill Down">
            <TripDrillDown data={tripDetails} />
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
