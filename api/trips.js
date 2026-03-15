import { DBSQLClient } from '@databricks/sql';

// ─── Databricks Connection Config ─────────────────────────────────────
// Set these in Vercel → Project Settings → Environment Variables:
//
//   DATABRICKS_SERVER_HOSTNAME  →  adb-xxxx.x.azuredatabricks.net
//   DATABRICKS_HTTP_PATH        →  /sql/1.0/warehouses/<warehouse-id>
//   DATABRICKS_ACCESS_TOKEN     →  dapi_xxxxxxxxxxxxxxxx
//
// Find these in: Databricks → SQL Warehouses → your warehouse → Connection Details
// ──────────────────────────────────────────────────────────────────────

const QUERY = `
SELECT
  created_at,
  trip_id,
  trip_status,
  branch_name,
  branch_id,
  consignor_branch_key,
  transporter_name,
  transporter_id,
  consignee_name,
  routename,
  route_code,
  origin_city,
  destination_city,
  vehicle_number,
  driver_name,
  distance_travelled,
  transit_time,
  trip_duration_in_hours,
  initial_eta,
  sta_breached,
  indent_status,
  indent_fteid,
  consent_status,
  tracking_status,
  mode_of_closure,
  trip_creation_source,
  epod_status,
  epod_submitted_bucket,
  freight_value_indent
FROM azure_hive_metastore.golden_layer_db.end_to_end_trips_data
WHERE created_at IS NOT NULL
ORDER BY created_at DESC
`;

function transformRow(row, index) {
  const createdAt = row.created_at ? String(row.created_at) : '';
  const month = createdAt.slice(0, 7);

  const staBreach = row.sta_breached === 1 || row.sta_breached === '1' || row.sta_breached === true;
  const tripClosed = row.trip_status === 'Closed';

  const indentStatus = row.indent_status;
  const hasIndent = indentStatus && indentStatus !== 'null' && indentStatus !== '';
  const indentAccepted = indentStatus === 'COMPLETELY_CLOSED' || indentStatus === 'PARTIALLY_CLOSED';

  const tracked = row.tracking_status === 'Tracked';
  const consentDone = row.consent_status === 'Accepted';
  const epodSubmitted = row.epod_status === 'VERIFIED_AS_SUCCESSFULLY_DELIVERED';

  const transitTime = parseFloat(row.transit_time) || 0;
  const initialEta = parseFloat(row.initial_eta) || 0;
  const distance = parseFloat(row.distance_travelled) || null;
  const tripDuration = parseFloat(row.trip_duration_in_hours) || null;

  let delayHours = null;
  if (staBreach) {
    if (initialEta > 0 && transitTime > initialEta) {
      delayHours = parseFloat((transitTime - initialEta).toFixed(1));
    } else {
      delayHours = parseFloat((Math.max(transitTime * 0.18, 2)).toFixed(1));
    }
  }

  let routeName = row.routename;
  if (!routeName || routeName === 'null') {
    const o = row.origin_city || '';
    const d = row.destination_city || '';
    routeName = (o && d) ? `${o} → ${d}` : 'Unknown';
  }

  const closure = row.mode_of_closure;
  let freight = null;
  try {
    const fv = row.freight_value_indent;
    if (fv && fv !== 'null') freight = parseFloat(parseFloat(fv).toFixed(2));
  } catch (_) {}

  return {
    id: index + 1,
    month,
    tripId: String(row.trip_id || ''),
    tripStatus: row.trip_status || '',
    branchName: row.branch_name || '',
    branchId: String(row.branch_id || ''),
    consignorKey: row.consignor_branch_key || '',
    transporterName: row.transporter_name || 'Unknown',
    transporterId: String(row.transporter_id || ''),
    consigneeName: row.consignee_name || 'Unknown',
    routeName,
    routeCode: row.route_code || null,
    originCity: row.origin_city || '',
    destinationCity: row.destination_city || '',
    vehicleNumber: row.vehicle_number || '',
    driverName: row.driver_name || '',
    distance: distance ? parseFloat(distance.toFixed(1)) : null,
    transitTime: transitTime ? parseFloat(transitTime.toFixed(1)) : null,
    tripDurationHours: tripDuration ? parseFloat(tripDuration.toFixed(1)) : null,
    staBreach,
    onTime: !staBreach && tripClosed,
    late: staBreach && tripClosed,
    delayHours,
    hasIndent: !!hasIndent,
    indentStatus: hasIndent ? indentStatus : null,
    indentAccepted,
    consentDone,
    consentStatus: row.consent_status || '',
    tracked,
    trackingStatus: row.tracking_status || '',
    modeOfClosure: (closure && closure !== 'null') ? closure : null,
    tripSource: row.trip_creation_source || '',
    epodStatus: row.epod_status || '',
    epodSubmitted,
    epodBucket: row.epod_submitted_bucket || null,
    freightValue: freight,
    createdAt,
  };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH, DATABRICKS_ACCESS_TOKEN } = process.env;

  if (!DATABRICKS_SERVER_HOSTNAME || !DATABRICKS_HTTP_PATH || !DATABRICKS_ACCESS_TOKEN) {
    return res.status(503).json({
      error: 'Databricks not configured',
      message: 'Set DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH, and DATABRICKS_ACCESS_TOKEN in environment variables.',
      fallback: true,
    });
  }

  let client;
  let session;
  let queryOperation;

  try {
    client = new DBSQLClient();

    await client.connect({
      host: DATABRICKS_SERVER_HOSTNAME,
      path: DATABRICKS_HTTP_PATH,
      token: DATABRICKS_ACCESS_TOKEN,
    });

    session = await client.openSession();
    queryOperation = await session.executeStatement(QUERY, { runAsync: true });
    const rows = await queryOperation.fetchAll();

    const transformed = rows.map((row, i) => transformRow(row, i));

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ data: transformed, count: transformed.length, source: 'databricks' });
  } catch (err) {
    console.error('Databricks query error:', err);
    return res.status(500).json({
      error: 'Databricks query failed',
      message: err.message,
      fallback: true,
    });
  } finally {
    if (queryOperation) try { await queryOperation.close(); } catch (_) {}
    if (session) try { await session.close(); } catch (_) {}
    if (client) try { await client.close(); } catch (_) {}
  }
}
