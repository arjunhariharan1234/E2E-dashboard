import { useState, useMemo, useEffect } from 'react';
import {
  loadDataset,
  loadDatasetLive,
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
import BranchScorecard from './components/BranchScorecard';
import TransporterScorecard from './components/TransporterScorecard';
import TransporterFulfilment from './components/TransporterFulfilment';
import RouteAnalysis from './components/RouteAnalysis';
import MoMTrends from './components/MoMTrends';
import RouteHeatmap from './components/RouteHeatmap';
import TripDrillDown from './components/TripDrillDown';
import Filters from './components/Filters';
import AdvancedViews from './components/AdvancedViews';
import GlobalSearch from './components/GlobalSearch';

// Load static data immediately so the UI is never empty
const STATIC_DATA = loadDataset();

export default function App() {
  const [allData, setAllData] = useState(STATIC_DATA);
  const [liveData, setLiveData] = useState(null);
  const [dataSource, setDataSource] = useState('static');
  const [loading, setLoading] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);

  const [filters, setFilters] = useState({
    months: MONTHS.map((m) => m.key),
    businessUnit: '',
    branches: [],
    transporters: [],
    dateFrom: '',
    dateTo: '',
  });
  const [activeSection, setActiveSection] = useState('overview');

  const handleSearchSelect = (type, name) => {
    if (type === 'branch') {
      setFilters((prev) => ({
        ...prev,
        branches: prev.branches.includes(name) ? prev.branches : [...prev.branches, name],
      }));
      setActiveSection('branch');
    } else {
      setFilters((prev) => ({
        ...prev,
        transporters: prev.transporters.includes(name) ? prev.transporters : [...prev.transporters, name],
      }));
      setActiveSection('transporter');
    }
  };

  // Attempt to fetch live data in background on mount
  useEffect(() => {
    loadDatasetLive().then(({ data, source, fetchedAt: ft }) => {
      if (source === 'databricks') {
        setLiveData(data);
        setLiveAvailable(true);
        setFetchedAt(ft);
      }
    });
  }, []);

  const handleToggleSource = (source) => {
    setLiveError('');
    if (source === 'live') {
      if (liveData) {
        setAllData(liveData);
        setDataSource('databricks');
      } else {
        setLoading(true);
        loadDatasetLive().then(({ data, source: s, fetchedAt: ft }) => {
          if (s === 'databricks') {
            setLiveData(data);
            setLiveAvailable(true);
            setAllData(data);
            setDataSource('databricks');
            setFetchedAt(ft);
          } else {
            setLiveError('Could not connect — check Databricks credentials');
            setDataSource('static');
          }
          setLoading(false);
        });
      }
    } else {
      setAllData(STATIC_DATA);
      setDataSource('static');
    }
  };

  // Derive unique months from live data
  const availableMonths = useMemo(() => {
    const monthSet = new Set(allData.map((r) => r.month));
    const allMonths = MONTHS.filter((m) => monthSet.has(m.key));
    // Add any months from live data not in the static MONTHS list
    for (const m of monthSet) {
      if (!allMonths.find((am) => am.key === m)) {
        const d = new Date(m + '-01');
        allMonths.push({ key: m, label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) });
      }
    }
    return allMonths.sort((a, b) => a.key.localeCompare(b.key));
  }, [allData]);

  // Derive unique branches & transporters from live data
  const availableBranches = useMemo(() => {
    const set = new Set(allData.map((r) => r.branchName).filter(Boolean));
    return [...set].sort().map((name) => {
      const existing = BRANCHES.find((b) => b.name === name);
      return existing || { id: name, name };
    });
  }, [allData]);

  const availableTransporters = useMemo(() => {
    const set = new Set(allData.map((r) => r.transporterName).filter(Boolean));
    return [...set].sort().map((name) => {
      const existing = TRANSPORTERS.find((t) => t.name === name);
      return existing || { id: name, name };
    });
  }, [allData]);

  // Ensure month filters are valid for current data
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      months: availableMonths.map((m) => m.key),
    }));
  }, [availableMonths]);

  const filtered = useMemo(() => {
    const hasCustomDate = filters.dateFrom || filters.dateTo;
    return allData.filter((r) => {
      // Date filtering: custom date range takes priority over month buttons
      if (hasCustomDate) {
        const d = r.createdAt ? r.createdAt.slice(0, 10) : '';
        if (filters.dateFrom && d < filters.dateFrom) return false;
        if (filters.dateTo && d > filters.dateTo) return false;
      } else {
        if (!filters.months.includes(r.month)) return false;
      }
      if (filters.businessUnit) {
        const bu = r.branchName || '';
        if (filters.businessUnit === 'HVBU' && !bu.includes('HVBU')) return false;
        if (filters.businessUnit === 'LVBU' && !bu.includes('LVBU')) return false;
      }
      if (filters.branches.length && !filters.branches.includes(r.branchName)) return false;
      if (filters.transporters.length && !filters.transporters.includes(r.transporterName))
        return false;
      return true;
    });
  }, [allData, filters]);

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
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl font-semibold tracking-tight">
              End to End Lifecycle Dashboard
            </h1>
            <p className="text-sm text-blue-200 mt-0.5">
              Brakes India &mdash; Indent to Delivery &mdash; Shipment Lifecycle
            </p>
          </div>
          <GlobalSearch
            branches={availableBranches}
            transporters={availableTransporters}
            onSelect={handleSearchSelect}
          />
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="text-blue-300 text-xs">
              {availableMonths.length > 0 && (
                <>Data: {availableMonths[0].label} &mdash; {availableMonths[availableMonths.length - 1].label}</>
              )}
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5">
              <button
                onClick={() => handleToggleSource('static')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  dataSource === 'static'
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Dataset
              </button>
              <button
                onClick={() => handleToggleSource('live')}
                disabled={loading}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  dataSource === 'databricks'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-blue-200 hover:text-white'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading ? 'Connecting...' : 'Live'}
              </button>
            </div>
            {dataSource === 'databricks' && (
              <span className="text-[10px] text-emerald-300">
                {allData.length.toLocaleString()} trips from Databricks
                {fetchedAt && (
                  <> &middot; Last refresh: {new Date(fetchedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</>
                )}
              </span>
            )}
            {dataSource === 'static' && !liveError && (
              <span className="text-[10px] text-blue-300">{allData.length.toLocaleString()} trips from dataset</span>
            )}
            {liveError && (
              <span className="text-[10px] text-red-400">{liveError}</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 py-4">
        <Filters
          filters={filters}
          onChange={setFilters}
          branches={availableBranches}
          transporters={availableTransporters}
          months={availableMonths}
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
          <>
            <Section title="Branch Performance &mdash; On Time vs Delayed">
              <BranchPerformance data={branchData} />
            </Section>
            <Section title="Branch Performance Scorecard">
              <BranchScorecard data={branchData} />
            </Section>
          </>
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
              <MoMTrends data={momData} months={availableMonths} />
            </Section>
            <Section title="Route OTD % &mdash; Monthly Heatmap">
              <RouteHeatmap data={routeMomData} months={availableMonths} />
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
