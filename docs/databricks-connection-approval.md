# Databricks PAT Token Request — E2E Lifecycle Dashboard

**Date:** 15 March 2026
**Requested by:** Arjun Hariharan
**Project:** End to End Lifecycle Dashboard — Brakes India
**Dashboard URL:** https://e2e-dashboard-seven.vercel.app
**GitHub:** https://github.com/arjunhariharan1234/E2E-dashboard

---

## 1. Purpose

We have built an End to End Lifecycle Dashboard that tracks the complete shipment lifecycle — Indent → Vehicle Placement → Trip → Delivery — across all Brakes India branches and transporters.

The dashboard is currently running on **sample data (1,000 records)**. To go live with production data, we need to connect it to the Databricks Golden Layer table:

```
azure_hive_metastore.golden_layer_db.end_to_end_trips_data
```

This requires a **Databricks Personal Access Token (PAT)** to authenticate the connection.

---

## 2. What the Dashboard Provides

The dashboard is designed for the **monthly operations compliance meeting** and provides:

| View | Purpose |
|------|---------|
| KPI Scorecard | OTD Rate, Indent Acceptance, Tracking Rate, Consent Rate, ePOD Compliance |
| Branch Performance | On Time vs Delayed breakdown per branch |
| Transporter Scorecard | Multi-metric performance table with conditional formatting |
| Route Analysis | On Time vs Delayed per route |
| MoM Trends | Month-over-month OTD trend for top 5 transporters |
| Route OTD Heatmap | Route × Month heatmap for pattern detection |
| Trip Detail Drill Down | Individual trip-level data with delay bucket filtering |
| Advanced Views | SLA Breach Report, Compliance Radar, ePOD Breakdown, Repeat Offender Analysis, Consignee Performance, and more |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Databricks                              │
│  azure_hive_metastore.golden_layer_db.end_to_end_trips_data │
└─────────────────────┬───────────────────────────────────────┘
                      │  SQL query (once per 24 hours)
                      │  SELECT 29 columns only
                      ▼
              ┌───────────────┐
              │ Vercel API    │  Serverless function
              │ /api/trips    │  (auto-scales to zero)
              └───────┬───────┘
                      │  Cached at 3 layers
                      ▼
              ┌───────────────┐
              │ Vercel CDN    │  Edge cache (24h TTL)
              │ (Global Edge) │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Browser       │  localStorage cache (24h TTL)
              │ (React App)   │
              └───────────────┘
```

**Data flow:** Databricks is queried **at most once every 24 hours**. All subsequent requests are served from cache.

---

## 4. What the PAT Token Is Used For

The PAT token authenticates the serverless API function to run a **read-only SELECT query** against the Golden Layer table.

### Query executed:

```sql
SELECT
  created_at, trip_id, trip_status, branch_name, branch_id,
  consignor_branch_key, transporter_name, transporter_id,
  consignee_name, routename, route_code, origin_city,
  destination_city, vehicle_number, driver_name,
  distance_travelled, transit_time, trip_duration_in_hours,
  initial_eta, sta_breached, indent_status, indent_fteid,
  consent_status, tracking_status, mode_of_closure,
  trip_creation_source, epod_status, epod_submitted_bucket,
  freight_value_indent
FROM azure_hive_metastore.golden_layer_db.end_to_end_trips_data
WHERE created_at IS NOT NULL
ORDER BY created_at DESC
```

- **Read-only** — no writes, updates, or deletes
- **29 columns** out of 123 — only what the dashboard needs
- **Single query** — all chart data is computed client-side in the browser

---

## 5. Security Measures

| Measure | Detail |
|---------|--------|
| **Token storage** | Stored as an encrypted environment variable in Vercel (not in code, not in git) |
| **No client exposure** | Token is only used server-side in the serverless function; never sent to the browser |
| **Read-only access** | The query only performs SELECT — no data modification capability |
| **Minimal column access** | Only 29 of 123 columns are queried |
| **No PII in dashboard** | Driver phone numbers, emails, and other PII columns are excluded from the query |
| **HTTPS only** | All communication (browser → Vercel → Databricks) is over TLS |
| **Git ignored** | `.env` files are in `.gitignore` — credentials never enter version control |
| **Token can be scoped** | PAT can be generated with limited lifetime and revoked at any time |

### Recommended PAT configuration:

| Setting | Recommended Value |
|---------|------------------|
| **Token name** | `e2e-dashboard-readonly` |
| **Lifetime** | 90 days (with calendar reminder to rotate) |
| **Permissions** | Read-only access to `golden_layer_db` |

---

## 6. Cost Controls

The dashboard is designed to minimize Databricks usage costs:

| Layer | Mechanism | Effect |
|-------|-----------|--------|
| **Browser cache** | localStorage with 24h TTL | Same user revisiting makes zero API calls |
| **Vercel CDN cache** | `s-maxage=86400` (24h) | All users globally served from edge cache after first request |
| **Stale-while-revalidate** | 48h window | After cache expires, stale data served instantly while refreshing in background |
| **Selective columns** | 29 of 123 columns | Reduces Databricks I/O scan (billed per data read) |
| **Single query** | 1 SQL query per refresh | All 12+ chart views computed from one query in the browser |
| **Serverless auto-scale** | Function scales to zero when idle | No idle compute cost on Vercel |
| **Static fallback** | Built-in sample data fallback | Dashboard works even if Databricks is unreachable — no retry loops |

### Estimated daily Databricks cost:

| Component | Frequency | Estimated Cost |
|-----------|-----------|---------------|
| SQL Warehouse wake-up | 1×/day | ~5 min of warehouse time |
| Data scanned per query | ~29 columns × N rows | Minimal DBU (~0.01) |
| **Total daily cost** | | **< $0.10/day** |

### SQL Warehouse recommendation:

Set the SQL Warehouse to **Auto Stop after 5 minutes**. The dashboard queries it once per day, so the warehouse will run for ~5 minutes and auto-stop, avoiding 24/7 runtime costs.

---

## 7. Setup Steps (After Approval)

Once the PAT token is generated, the setup takes less than 5 minutes:

**Step 1** — Generate PAT token in Databricks:
- Databricks → User Settings → Developer → Access Tokens → Generate New Token
- Name: `e2e-dashboard-readonly`
- Lifetime: 90 days

**Step 2** — Collect SQL Warehouse connection details:
- Databricks → SQL Warehouses → select warehouse → Connection Details
- Note: **Server Hostname** and **HTTP Path**

**Step 3** — Add 3 environment variables in Vercel:
- Vercel Dashboard → e2e-dashboard → Settings → Environment Variables

| Variable | Value |
|----------|-------|
| `DATABRICKS_SERVER_HOSTNAME` | `adb-xxxx.x.azuredatabricks.net` |
| `DATABRICKS_HTTP_PATH` | `/sql/1.0/warehouses/<warehouse-id>` |
| `DATABRICKS_ACCESS_TOKEN` | `dapi_xxxxxxxxxxxxxxxx` |

**Step 4** — Redeploy:
```bash
vercel deploy --prod
```

The dashboard header badge will switch from "Sample Data" to "Live — Databricks" once connected.

---

## 8. Rollback / Revocation

If the token needs to be revoked at any time:

1. **Databricks** → User Settings → Access Tokens → Revoke the token
2. The dashboard will automatically fall back to sample data — no downtime, no errors
3. A new token can be generated and added to Vercel at any time

---

## 9. Summary

| Item | Detail |
|------|--------|
| **What we need** | A Databricks PAT token with read access to `golden_layer_db.end_to_end_trips_data` |
| **Why** | To power the E2E Lifecycle Dashboard with live production data for the monthly compliance meeting |
| **Access type** | Read-only SELECT query, 29 columns |
| **Frequency** | Once per 24 hours (3-layer cache) |
| **Cost** | < $0.10/day estimated |
| **Security** | Token stored encrypted in Vercel, never in code/git, never exposed to browser |
| **Reversibility** | Token can be revoked instantly; dashboard falls back to sample data |
