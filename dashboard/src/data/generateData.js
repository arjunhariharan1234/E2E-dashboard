import RAW_DATA from './csvData.json';

// ── Dimension lists extracted from real Brakes India CSV ──────────────

const BRANCHES = [
  { id: '174992', name: 'Sholinghur - HVBU' },
  { id: '177604', name: 'Kuruli - Pune - LVBU - Subham - WH' },
  { id: '177602', name: 'Pune - HVBU - Subham - WH' },
  { id: '176284', name: 'Sanand - LVBU' },
  { id: '175380', name: 'Vijayshri - TG05 - Pithampur - HVBU' },
  { id: '175014', name: 'Padi - LVBU' },
  { id: '175310', name: 'Sitarganj - HVBU' },
  { id: '175012', name: 'Padi - HVBU' },
  { id: '175520', name: 'Polambakkam - LVBU' },
  { id: '175406', name: 'Avadi - HVBU - Aztec' },
  { id: '175334', name: 'Jamshedpur - HVBU - BD25' },
  { id: '176460', name: 'Jhagadia - LVBU' },
  { id: '175522', name: 'Polambakkam - HVBU' },
  { id: '175510', name: 'Thervoy kandigai - HVBU' },
];

const TRANSPORTERS = [
  { id: '1525698', name: 'SUBHAM FREIGHT CARRIERS INDIA PVT LTD' },
  { id: '1525702', name: 'Globe Eco Logistics Pvt. Ltd' },
  { id: '1525705', name: 'KRISHNA TRANSPORT SERVICE' },
  { id: '1525710', name: 'VIJAYSHRI INDUSTRIAL SALES SERVICES' },
  { id: '1525699', name: 'SVVS LOGISTICS' },
  { id: '1525711', name: 'SRI BALAJI TRANSPORT' },
  { id: '1525707', name: 'KS TRANSPORT' },
  { id: '1525720', name: 'SPOTON SUPPLY CHAIN SOLUTIONS Private Limited' },
  { id: '1525715', name: 'HEAVY LIFTERS OF INDIA PRIVATE LIMITED' },
  { id: '1525714', name: 'SRI BHARATHI LORRY SERVICE' },
  { id: '1525718', name: 'M.Raja transport' },
  { id: '1525716', name: 'SCC Transco Private Limited' },
  { id: '1525719', name: 'UTTAM KAUR (U K) ROAD LINES' },
  { id: '1525721', name: 'Mahalakshmi Logistics Pvt. Ltd' },
  { id: '1525722', name: 'MANASA CARGO MOVERS' },
];

const CONSIGNEES = [
  'Brakes India Private Limited',
  'MAHINDRA & MAHINDRA LIMITED',
  'TATA MOTORS LIMITED',
  'VE COMMERCIAL VEHICLES LIMITED',
  'AAM INDIA MANUFACTURING CORPORATION',
  'Suzuki Motors Gujarat Pvt Ltd.',
  'ASHOK LEYLAND LIMITED',
  'Tata Passenger Electric Mobility Limited',
  'Tata Motors Passenger Vehicles Limited',
  'JOHN DEERE INDIA PRIVATE LIMITED',
  'Force Motors Limited',
  'DAIMLER INDIA COMMERCIAL VEHICLES P',
  'DANA ANAND INDIA PRIVATE LTD',
];

const MONTHS = [
  { key: '2025-09', label: 'Sep 2025' },
  { key: '2025-10', label: 'Oct 2025' },
  { key: '2025-11', label: 'Nov 2025' },
  { key: '2025-12', label: 'Dec 2025' },
  { key: '2026-01', label: 'Jan 2026' },
  { key: '2026-02', label: 'Feb 2026' },
  { key: '2026-03', label: 'Mar 2026' },
];

const MONTH_LABELS = {};
MONTHS.forEach((m) => { MONTH_LABELS[m.key] = m.label; });

// ── Schema field definitions ──────────────────────────────────────────
// Maps dashboard field names → actual DB column + description + formula

const FIELD_INFO = {
  // ── Trip fields ──
  tripId:           { column: 'trip_id',               label: 'Trip ID',              desc: 'Unique identifier for each trip in FourKites/FT system.' },
  tripStatus:       { column: 'trip_status',           label: 'Trip Status',          desc: 'Current state of the trip. Values: Open, Closed.' },
  createdAt:        { column: 'created_at',            label: 'Trip Created At',      desc: 'Timestamp when the trip was created in the system.' },
  tripSource:       { column: 'trip_creation_source',  label: 'Trip Source',          desc: 'How the trip was created. Values: V5-INTEGRATION-outbound, V5-ROUNDTRIP-inbound, V5-UI-outbound.' },
  modeOfClosure:    { column: 'mode_of_closure',       label: 'Mode of Closure',      desc: 'How trip was closed. Values: Auto Closed (reached destination), Auto Terminated (timed out), Manual.' },
  vehicleNumber:    { column: 'vehicle_number',        label: 'Vehicle Number',       desc: 'Registration number of the vehicle assigned to the trip.' },
  driverName:       { column: 'driver_name',           label: 'Driver Name',          desc: 'Name of the driver operating the vehicle.' },

  // ── Location fields ──
  originCity:       { column: 'origin_city',           label: 'Origin City',          desc: 'City from where the shipment originates (loading point).' },
  destinationCity:  { column: 'destination_city',      label: 'Destination City',     desc: 'City where the shipment is to be delivered (unloading point).' },
  routeName:        { column: 'routename',             label: 'Route Name',           desc: 'Named route from indent. Format: "Origin to Destination". From indent_loading_point → indent_unloading_point.' },
  routeCode:        { column: 'route_code',            label: 'Route Code',           desc: 'System route code (e.g., MHMH03 = Maharashtra to Maharashtra route #3). Maps to indent_route_code.' },

  // ── Branch / Org fields ──
  branchName:       { column: 'branch_name',           label: 'Branch Name',          desc: 'Brakes India branch/plant that created the shipment. Format: Location - Division (HVBU/LVBU).' },
  branchId:         { column: 'branch_id',             label: 'Branch ID',            desc: 'Unique numeric identifier for the branch in FourKites system.' },
  consignorKey:     { column: 'consignor_branch_key',  label: 'Consignor Key',        desc: 'Short code for the consignor branch (e.g., BD03 = Brake Division Sholinghur, TG07 = Kuruli Pune).' },
  consigneeName:    { column: 'consignee_name',        label: 'Consignee Name',       desc: 'Name of the receiving customer/company (e.g., TATA MOTORS LIMITED, MAHINDRA & MAHINDRA).' },

  // ── Transporter fields ──
  transporterName:  { column: 'transporter_name',      label: 'Transporter',          desc: 'Name of the logistics/transport company assigned to carry the shipment.' },
  transporterId:    { column: 'transporter_id',        label: 'Transporter ID',       desc: 'Unique numeric identifier for the transporter in FourKites system.' },

  // ── Metrics fields ──
  distance:         { column: 'distance_travelled',    label: 'Distance (km)',        desc: 'Total GPS distance travelled by the vehicle in km, tracked via FourKites.' },
  transitTime:      { column: 'transit_time',          label: 'Transit Time (hrs)',    desc: 'Time in hours from trip creation to trip closure. Includes loading, transit, and unloading.' },
  tripDurationHours:{ column: 'trip_duration_in_hours',label: 'Trip Duration (hrs)',   desc: 'Maximum allowed trip duration in hours before auto-termination. Set at trip creation.' },
  staBreach:        { column: 'sta_breached',          label: 'STA Breached',         desc: 'Whether the Scheduled Time of Arrival was breached. 1 = Late (breached), 0 = On Time.',
                      formula: 'sta_breached = 1 when actual_delivery_time > planned_STA' },

  // ── Indent fields ──
  indentStatus:     { column: 'indent_status',         label: 'Indent Status',        desc: 'Status of the indent/booking request. Values: COMPLETELY_CLOSED, EXPIRED, REJECTED, PARTIALLY_CLOSED.',
                      formula: 'COMPLETELY_CLOSED → indent accepted & vehicle placed & trip completed' },
  hasIndent:        { column: 'indent_fteid',          label: 'Has Indent',           desc: 'Whether this trip originated from a formal indent (booking request). Some trips are created directly without indent.' },

  // ── Tracking & Consent ──
  consentStatus:    { column: 'consent_status',        label: 'Consent Status',       desc: 'Whether driver SIM tracking consent was obtained. Values: Accepted, Not Done.',
                      formula: 'Consent Rate = COUNT(consent_status = "Accepted") / COUNT(*) × 100' },
  trackingStatus:   { column: 'tracking_status',       label: 'Tracking Status',      desc: 'Whether the trip was actively tracked via GPS. Values: Tracked, Not Tracked.',
                      formula: 'Tracking Rate = COUNT(tracking_status = "Tracked") / COUNT(*) × 100' },

  // ── ePOD fields ──
  epodStatus:       { column: 'epod_status',           label: 'ePOD Status',          desc: 'Electronic Proof of Delivery status. Values: VERIFIED_AS_SUCCESSFULLY_DELIVERED, PENDING_SUBMISSION, AWAITING_APPROVAL.',
                      formula: 'ePOD Compliance = COUNT(epod_status = "VERIFIED_AS_SUCCESSFULLY_DELIVERED") / COUNT(*) × 100' },
  epodBucket:       { column: 'epod_submitted_bucket', label: 'ePOD Submission Bucket', desc: 'Time bucket for when ePOD was submitted after delivery. Values: 0-24 hrs, 24-48 hrs, 48-72 hrs, >72 hrs.' },

  // ── Financial fields ──
  freightValue:     { column: 'freight_value_indent',  label: 'Freight Value',        desc: 'Freight cost for the indent in INR. Derived from vehicle_rate or rate_per_tonne × material_weight.',
                      formula: 'freight_value = vehicle_rate (PER_TRUCK) OR rate_per_tonne × material_weight (PER_TONNE)' },

  // ── KPI formulas ──
  totalTrips:       { column: 'COUNT(trip_id)',         label: 'Total Trips',          desc: 'Total number of trips created in the selected period.',
                      formula: 'COUNT(DISTINCT trip_id) WHERE trip_status IS NOT NULL' },
  onTimeRate:       { column: 'sta_breached',          label: 'OTD Rate (%)',          desc: 'On Time Delivery rate — percentage of trips that met the Scheduled Time of Arrival.',
                      formula: 'OTD % = COUNT(sta_breached = 0 AND trip_status = "Closed") / COUNT(trip_status = "Closed") × 100' },
  acceptanceRate:   { column: 'indent_status',         label: 'Indent Acceptance Rate (%)', desc: 'Percentage of indents that were accepted and completed vs total indents raised.',
                      formula: 'Acceptance % = COUNT(indent_status IN ("COMPLETELY_CLOSED","PARTIALLY_CLOSED")) / COUNT(indent_status IS NOT NULL) × 100' },
  trackingRate:     { column: 'tracking_status',       label: 'Tracking Rate (%)',     desc: 'Percentage of trips being actively GPS tracked.',
                      formula: 'Tracking % = COUNT(tracking_status = "Tracked") / COUNT(*) × 100' },
  consentRate:      { column: 'consent_status',        label: 'Consent Rate (%)',      desc: 'Percentage of trips where driver SIM consent was obtained.',
                      formula: 'Consent % = COUNT(consent_status = "Accepted") / COUNT(*) × 100' },
  epodRate:         { column: 'epod_status',           label: 'ePOD Verified (%)',     desc: 'Percentage of trips with successfully verified electronic Proof of Delivery.',
                      formula: 'ePOD % = COUNT(epod_status = "VERIFIED_AS_SUCCESSFULLY_DELIVERED") / COUNT(*) × 100' },
};

// ── Data loader ───────────────────────────────────────────────────────

function loadDataset() {
  return RAW_DATA.map((r) => ({
    ...r,
    monthLabel: MONTH_LABELS[r.month] || r.month,
  }));
}

function enrichRecords(records) {
  return records.map((r) => ({
    ...r,
    monthLabel: MONTH_LABELS[r.month] || r.month,
  }));
}

// ── Browser-side 24-hour cache ────────────────────────────────────────
// Prevents any network call if fresh data exists in localStorage.
// Databricks is only queried when:
//   1. No cache exists (first visit)
//   2. Cache is older than 24 hours
//   3. User force-refreshes (shift+reload clears cache)

const CACHE_KEY = 'bi_e2e_trips_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (_) {
    // localStorage full or unavailable — silently skip
  }
}

async function fetchFromDatabricks() {
  const res = await fetch('/api/trips');
  const json = await res.json();
  if (json.fallback || json.error) return null;
  return json.data;
}

async function loadDatasetLive() {
  // 1. Check browser cache first — zero cost
  const cached = getCachedData();
  if (cached && cached.length > 0) {
    return { data: enrichRecords(cached), source: 'databricks' };
  }

  // 2. Try Databricks API (Vercel CDN will also serve from its 24h cache)
  try {
    const live = await fetchFromDatabricks();
    if (live && live.length > 0) {
      setCachedData(live); // save to browser for next 24h
      return { data: enrichRecords(live), source: 'databricks' };
    }
  } catch (_) {}

  // 3. Fallback to static sample data
  return { data: loadDataset(), source: 'static' };
}

// ── Aggregation helpers ───────────────────────────────────────────────

function aggregateByField(records, field) {
  const map = {};
  for (const r of records) {
    const key = r[field];
    if (!key) continue;
    if (!map[key]) {
      map[key] = {
        key,
        total: 0,
        closed: 0,
        onTime: 0,
        late: 0,
        hasIndent: 0,
        indentAccepted: 0,
        tracked: 0,
        consentDone: 0,
        epodSubmitted: 0,
      };
    }
    const g = map[key];
    g.total++;
    if (r.tripStatus === 'Closed') g.closed++;
    if (r.onTime) g.onTime++;
    if (r.late) g.late++;
    if (r.hasIndent) g.hasIndent++;
    if (r.indentAccepted) g.indentAccepted++;
    if (r.tracked) g.tracked++;
    if (r.consentDone) g.consentDone++;
    if (r.epodSubmitted) g.epodSubmitted++;
  }
  return Object.values(map);
}

function aggregateByTwoFields(records, field1, field2) {
  const map = {};
  for (const r of records) {
    const k = `${r[field1]}||${r[field2]}`;
    if (!map[k]) {
      map[k] = {
        [field1]: r[field1],
        [field2]: r[field2],
        total: 0, closed: 0, onTime: 0, late: 0,
        hasIndent: 0, indentAccepted: 0, tracked: 0, consentDone: 0, epodSubmitted: 0,
      };
    }
    const g = map[k];
    g.total++;
    if (r.tripStatus === 'Closed') g.closed++;
    if (r.onTime) g.onTime++;
    if (r.late) g.late++;
    if (r.hasIndent) g.hasIndent++;
    if (r.indentAccepted) g.indentAccepted++;
    if (r.tracked) g.tracked++;
    if (r.consentDone) g.consentDone++;
    if (r.epodSubmitted) g.epodSubmitted++;
  }
  return Object.values(map);
}

function getKPIs(records) {
  let total = 0, closed = 0, onTime = 0, late = 0;
  let hasIndent = 0, indentAccepted = 0;
  let tracked = 0, consentDone = 0, epodSubmitted = 0;

  for (const r of records) {
    total++;
    if (r.tripStatus === 'Closed') closed++;
    if (r.onTime) onTime++;
    if (r.late) late++;
    if (r.hasIndent) hasIndent++;
    if (r.indentAccepted) indentAccepted++;
    if (r.tracked) tracked++;
    if (r.consentDone) consentDone++;
    if (r.epodSubmitted) epodSubmitted++;
  }

  const pct = (num, den) => den ? ((num / den) * 100).toFixed(1) : '0.0';

  return {
    totalTrips: total,
    closedTrips: closed,
    onTimeTrips: onTime,
    lateTrips: late,
    otdRate: pct(onTime, closed),
    totalIndents: hasIndent,
    indentsAccepted: indentAccepted,
    acceptanceRate: pct(indentAccepted, hasIndent),
    trackingRate: pct(tracked, total),
    consentRate: pct(consentDone, total),
    epodRate: pct(epodSubmitted, total),
    trackedCount: tracked,
    consentCount: consentDone,
    epodCount: epodSubmitted,
  };
}

function getTripDetails(records) {
  return records
    .filter((r) => r.tripStatus === 'Closed')
    .map((r) => {
      const delayHours = r.delayHours;
      let delayBucket = 'On Time';
      if (delayHours && delayHours > 0) {
        if (delayHours <= 2) delayBucket = '0-2h';
        else if (delayHours <= 6) delayBucket = '2-6h';
        else if (delayHours <= 12) delayBucket = '6-12h';
        else if (delayHours <= 24) delayBucket = '12-24h';
        else delayBucket = '24h+';
      }
      return {
        tripId: r.tripId,
        vehicleNumber: r.vehicleNumber,
        transporter: r.transporterName,
        branch: r.branchName,
        route: r.routeName,
        consignee: r.consigneeName,
        originCity: r.originCity,
        destinationCity: r.destinationCity,
        status: r.staBreach ? 'Delayed' : 'On Time',
        delayHours: delayHours,
        delayBucket,
        distance: r.distance,
        transitTime: r.transitTime,
        modeOfClosure: r.modeOfClosure,
        epodStatus: r.epodStatus,
        tracked: r.tracked,
      };
    })
    .sort((a, b) => (b.delayHours || 0) - (a.delayHours || 0));
}

const DELAY_BUCKETS = ['On Time', '0-2h', '2-6h', '6-12h', '12-24h', '24h+'];

export {
  BRANCHES,
  TRANSPORTERS,
  CONSIGNEES,
  MONTHS,
  FIELD_INFO,
  DELAY_BUCKETS,
  loadDataset,
  loadDatasetLive,
  aggregateByField,
  aggregateByTwoFields,
  getKPIs,
  getTripDetails,
};
