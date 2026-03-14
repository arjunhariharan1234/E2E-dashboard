const BRANCHES = [
  { id: 'BR001', name: 'Chennai Central', region: 'South' },
  { id: 'BR002', name: 'Bangalore Hub', region: 'South' },
  { id: 'BR003', name: 'Hyderabad DC', region: 'South' },
  { id: 'BR004', name: 'Mumbai West', region: 'West' },
  { id: 'BR005', name: 'Pune Logistics', region: 'West' },
  { id: 'BR006', name: 'Delhi NCR', region: 'North' },
  { id: 'BR007', name: 'Kolkata East', region: 'East' },
  { id: 'BR008', name: 'Ahmedabad West', region: 'West' },
];

const TRANSPORTERS = [
  { id: 'TR001', name: 'SafeExpress', tier: 'Gold' },
  { id: 'TR002', name: 'BlueDart Freight', tier: 'Gold' },
  { id: 'TR003', name: 'Gati Transport', tier: 'Silver' },
  { id: 'TR004', name: 'TCI Express', tier: 'Silver' },
  { id: 'TR005', name: 'Rivigo Fleet', tier: 'Gold' },
  { id: 'TR006', name: 'Delhivery Cargo', tier: 'Silver' },
  { id: 'TR007', name: 'VRL Logistics', tier: 'Bronze' },
  { id: 'TR008', name: 'Om Logistics', tier: 'Bronze' },
  { id: 'TR009', name: 'Ecom Express', tier: 'Silver' },
  { id: 'TR010', name: 'XpressBees', tier: 'Bronze' },
];

const ROUTES = [
  { id: 'RT001', origin: 'Chennai', destination: 'Bangalore', distance: 350 },
  { id: 'RT002', origin: 'Chennai', destination: 'Hyderabad', distance: 630 },
  { id: 'RT003', origin: 'Mumbai', destination: 'Pune', distance: 150 },
  { id: 'RT004', origin: 'Mumbai', destination: 'Ahmedabad', distance: 530 },
  { id: 'RT005', origin: 'Delhi', destination: 'Kolkata', distance: 1530 },
  { id: 'RT006', origin: 'Bangalore', destination: 'Hyderabad', distance: 570 },
  { id: 'RT007', origin: 'Pune', destination: 'Hyderabad', distance: 560 },
  { id: 'RT008', origin: 'Delhi', destination: 'Mumbai', distance: 1420 },
  { id: 'RT009', origin: 'Chennai', destination: 'Mumbai', distance: 1340 },
  { id: 'RT010', origin: 'Kolkata', destination: 'Chennai', distance: 1670 },
  { id: 'RT011', origin: 'Bangalore', destination: 'Pune', distance: 840 },
  { id: 'RT012', origin: 'Ahmedabad', destination: 'Delhi', distance: 950 },
];

const MONTHS = [
  { key: '2025-10', label: 'Oct 2025' },
  { key: '2025-11', label: 'Nov 2025' },
  { key: '2025-12', label: 'Dec 2025' },
  { key: '2026-01', label: 'Jan 2026' },
  { key: '2026-02', label: 'Feb 2026' },
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateDataset() {
  const rng = seededRandom(42);
  const records = [];
  let counter = 0;

  for (const month of MONTHS) {
    for (const branch of BRANCHES) {
      const numCombos = 3 + Math.floor(rng() * 4);
      for (let c = 0; c < numCombos; c++) {
        const transporter = pick(TRANSPORTERS, rng);
        const route = pick(ROUTES, rng);
        const numIndents = 3 + Math.floor(rng() * 8);

        for (let i = 0; i < numIndents; i++) {
          counter++;
          const accepted = rng() < 0.68;
          const placed = accepted && rng() < 0.92;
          const placedOnTime = placed && rng() < 0.70;
          const hasTrip = placed && rng() < 0.90;
          const deliveredOnTime = hasTrip && rng() < 0.65;
          const delayMinutes = hasTrip
            ? deliveredOnTime
              ? -Math.floor(rng() * 480)
              : Math.floor(30 + rng() * 2880)
            : null;

          records.push({
            id: counter,
            month: month.key,
            monthLabel: month.label,
            branchId: branch.id,
            branchName: branch.name,
            region: branch.region,
            transporterId: transporter.id,
            transporterName: transporter.name,
            transporterTier: transporter.tier,
            routeId: route.id,
            routeName: `${route.origin} → ${route.destination}`,
            distance: route.distance,
            accepted,
            placed,
            placedOnTime,
            hasTrip,
            deliveredOnTime,
            delayMinutes,
          });
        }
      }
    }
  }

  return records;
}

export function aggregateByField(records, field) {
  const map = {};
  for (const r of records) {
    const key = r[field];
    if (!map[key]) {
      map[key] = {
        key,
        indents: 0,
        accepted: 0,
        placed: 0,
        placedOnTime: 0,
        placedLate: 0,
        trips: 0,
        onTime: 0,
        late: 0,
      };
    }
    const g = map[key];
    g.indents++;
    if (r.accepted) g.accepted++;
    if (r.placed) {
      g.placed++;
      if (r.placedOnTime) g.placedOnTime++;
      else g.placedLate++;
    }
    if (r.hasTrip) {
      g.trips++;
      if (r.deliveredOnTime) g.onTime++;
      else g.late++;
    }
  }
  return Object.values(map);
}

export function aggregateByTwoFields(records, field1, field2) {
  const map = {};
  for (const r of records) {
    const k = `${r[field1]}||${r[field2]}`;
    if (!map[k]) {
      map[k] = {
        [field1]: r[field1],
        [field2]: r[field2],
        indents: 0, accepted: 0, placed: 0, placedOnTime: 0,
        trips: 0, onTime: 0, late: 0,
      };
    }
    const g = map[k];
    g.indents++;
    if (r.accepted) g.accepted++;
    if (r.placed) { g.placed++; if (r.placedOnTime) g.placedOnTime++; }
    if (r.hasTrip) { g.trips++; if (r.deliveredOnTime) g.onTime++; else g.late++; }
  }
  return Object.values(map);
}

export function getKPIs(records) {
  const totals = aggregateByField(records, 'branchName').reduce(
    (acc, g) => ({
      indents: acc.indents + g.indents,
      accepted: acc.accepted + g.accepted,
      placed: acc.placed + g.placed,
      placedOnTime: acc.placedOnTime + g.placedOnTime,
      trips: acc.trips + g.trips,
      onTime: acc.onTime + g.onTime,
    }),
    { indents: 0, accepted: 0, placed: 0, placedOnTime: 0, trips: 0, onTime: 0 }
  );

  return {
    totalIndents: totals.indents,
    acceptanceRate: totals.indents ? ((totals.accepted / totals.indents) * 100).toFixed(1) : 0,
    vehiclesPlaced: totals.placed,
    placementRate: totals.placed ? ((totals.placedOnTime / totals.placed) * 100).toFixed(1) : 0,
    totalTrips: totals.trips,
    otdRate: totals.trips ? ((totals.onTime / totals.trips) * 100).toFixed(1) : 0,
  };
}

function getDelayBucket(delayMinutes) {
  if (delayMinutes <= 0) return 'On Time';
  const hours = delayMinutes / 60;
  if (hours <= 2) return '0-2h';
  if (hours <= 6) return '2-6h';
  if (hours <= 12) return '6-12h';
  if (hours <= 24) return '12-24h';
  return '24h+';
}

export const DELAY_BUCKETS = ['On Time', '0-2h', '2-6h', '6-12h', '12-24h', '24h+'];

export function getTripDetails(records) {
  return records
    .filter((r) => r.hasTrip)
    .map((r) => {
      const delayHours = r.delayMinutes !== null ? parseFloat((r.delayMinutes / 60).toFixed(1)) : null;
      return {
        tripId: `TRP-${String(r.id).padStart(6, '0')}`,
        vehicleId: `VH-${String(r.id).padStart(5, '0')}`,
        transporter: r.transporterName,
        branch: r.branchName,
        route: r.routeName,
        status: r.deliveredOnTime ? 'On Time' : 'Late',
        delayMinutes: r.delayMinutes,
        delayHours,
        delayBucket: getDelayBucket(r.delayMinutes),
      };
    })
    .sort((a, b) => b.delayMinutes - a.delayMinutes);
}

export { BRANCHES, TRANSPORTERS, ROUTES, MONTHS };
