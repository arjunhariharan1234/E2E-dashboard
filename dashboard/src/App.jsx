import { useState, useMemo } from 'react';
import {
  loadDataset,
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
import AdvancedViews from './components/AdvancedViews';

const ALL_DATA = loadDataset();

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
    { id: 'advanced', label: 'Advanced Views' },
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
              Brakes India &mdash; Indent to Delivery &mdash; Shipment Lifecycle
            </p>
          </div>
          <div className="text-xs text-blue-300 text-right">
            <div>Data: Sep 2025 &mdash; Mar 2026</div>
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
          <KPICard label="Total Trips" value={kpis.totalTrips.toLocaleString()} color="#1e3a5f" fieldKey="totalTrips" />
          <KPICard label="OTD Rate" value={`${kpis.otdRate}%`} color="#2ecc71" target={80} actual={parseFloat(kpis.otdRate)} fieldKey="onTimeRate" />
          <KPICard label="Indent Acceptance" value={`${kpis.acceptanceRate}%`} color="#1fa8c9" target={80} actual={parseFloat(kpis.acceptanceRate)} fieldKey="acceptanceRate" />
          <KPICard label="Tracking Rate" value={`${kpis.trackingRate}%`} color="#6c5ce7" target={85} actual={parseFloat(kpis.trackingRate)} fieldKey="trackingRate" />
          <KPICard label="Consent Rate" value={`${kpis.consentRate}%`} color="#f39c12" target={70} actual={parseFloat(kpis.consentRate)} fieldKey="consentRate" />
          <KPICard label="ePOD Verified" value={`${kpis.epodRate}%`} color="#e74c3c" target={50} actual={parseFloat(kpis.epodRate)} fieldKey="epodRate" />
        </div>

        {(activeSection === 'overview' || activeSection === 'branch') && (
          <Section title="Branch Performance &mdash; On Time vs Delayed">
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
          <Section title="Route Level &mdash; On Time vs Delayed">
            <RouteAnalysis data={routeData} />
          </Section>
        )}

        {(activeSection === 'overview' || activeSection === 'trends') && (
          <>
            <Section title="MoM Transporter OTD % (Top 5)">
              <MoMTrends data={momData} months={MONTHS} />
            </Section>
            <Section title="Route OTD % &mdash; Monthly Heatmap">
              <RouteHeatmap data={routeMomData} months={MONTHS} />
            </Section>
          </>
        )}

        {(activeSection === 'overview' || activeSection === 'drilldown') && (
          <Section title="Trip Detail Drill Down">
            <TripDrillDown data={tripDetails} />
          </Section>
        )}

        {activeSection === 'advanced' && (
          <AdvancedViews data={filtered} />
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
