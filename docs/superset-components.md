# Apache Superset Components — Brakes India Dashboard

## Chart Types Used

| # | Chart Type | Superset Viz Type | Usage |
|---|-----------|-------------------|-------|
| 1 | Big Number | `big_number_total` | 6 KPI cards — Total Indents, Acceptance %, Vehicles Placed, Placement %, Total Trips, OTD Rate |
| 2 | Stacked Bar (ECharts) | `echarts_timeseries_bar` | Branch Performance — On Time vs Delayed |
| 3 | Table with Conditional Formatting | `table` | Transporter Scorecard — 7 metrics with color rules (<60 red, ≥80 blue) |
| 4 | Grouped Bar (ECharts) | `echarts_timeseries_bar` | Transporter Indent Fulfilment |
| 5 | Stacked Bar | `echarts_timeseries_bar` | Route Level — On Time vs Delayed |
| 6 | Time-series Line (ECharts) | `echarts_timeseries_line` | MoM Transporter OTD % (Top 5), markers enabled |
| 7 | Heatmap | `heatmap` | Route OTD % Monthly, color scheme: `superset_seq_1` |
| 8 | Pivot Table | pivot table | Compliance Matrix with conditional formatting + cross-filter |
| 9 | Radar Chart (ECharts) | radar | Branch Comparison Radar |
| 10 | Pie Chart | pie | ePOD Compliance Breakdown, Trip Creation Source Analysis |

## Native Filters (4)

| Filter | Type | Column |
|--------|------|--------|
| Date Range | Time Filter | `month_date` |
| Branch | Value Filter | `branch_name` |
| Transporter | Value Filter | `transporter_name` |
| Route | Value Filter | `route_name` |

All filters support multi-select. Cross-filter drill-down hierarchy: Branch → Transporter → Route → Trip Details.

## Superset Features Used

| Feature | Category | Description |
|---------|----------|-------------|
| Native Filter Panel | Interactive | Persistent sidebar with cascading filters |
| Cross-filter Drill Down | Interactive | Click bars to filter all charts |
| Time Grain Controls | Interactive | Toggle daily/weekly/monthly/quarterly aggregations |
| SQL Lab / Ad-hoc Queries | Advanced | Custom SQL against the database |
| Dashboard-level URL Params | Sharing | Bookmark filter states |
| Scheduled Reports & Alerts | Automation | Automated email/Slack reports |
| Row-Level Security (RLS) | Security | Restrict data visibility by branch/transporter |
| Embedded Analytics | Integration | Embed dashboard/charts via iframe with JWT |
| Materialized Views | Performance | Pre-aggregate heavy queries for sub-second loads |
| Chart Annotations | Advanced | Event annotations on time-series charts |
| Export & Download | Sharing | CSV/Excel/PDF exports with scheduling |
| Real-time Refresh | Interactive | Auto-refresh intervals (30s, 1m, 5m) |

## Pre-configured Alerts (8)

| Alert | Trigger | Severity |
|-------|---------|----------|
| OTD Below 75% | OTD rate drops below 75% for any branch | High |
| ePOD Backlog | Pending ePOD submissions exceed threshold | Medium |
| Tracking Drop | Tracking rate falls below 80% | Medium |
| Auto Terminated Spike | Auto-terminated trips spike above normal | High |
| Weekly MoM Report | Scheduled weekly digest | Info |
| Monthly Compliance Pack | Full monthly report with PDF export | Info |
| Transporter SLA Breach | Transporter repeatedly misses SLA | High |
| Indent Rejection Spike | Indent rejection rate exceeds threshold | Medium |

## SQL Lab Queries (5)

1. **Monthly Compliance Summary** — MoM KPI comparison across branches
2. **Delayed Trips Deep Dive** — All delayed trips with delay hours and root cause
3. **Transporter vs Route Performance Matrix** — Cross-tab OTD % for weak pairings
4. **ePOD Aging Report** — Pending ePOD submissions by time bucket
5. **Auto Terminated Investigation** — Trips that timed out before delivery

Queries use Superset time parameters: `{{ from_dttm }}` and `{{ to_dttm }}`.

## Virtual Dataset

- **Source table**: `mv_lifecycle_summary` (materialized view)
- **Underlying fact tables**: `fact_indents`, `fact_vehicle_placements`, `fact_trips`
- **Dimensions**: `dim_branches`, `dim_transporters`, `dim_routes`
- **Refresh**: Every 4 hours on weekdays via `pg_cron`

## Caching

- **Backend**: Redis (`localhost:6379`)
- **Cache timeout**: 300s (results), 600s (data)
- **Key prefix**: `superset_`
- **Dashboard refresh**: 300s (5 min)

## Dashboard Metadata

- **Title**: Indent → Delivery Compliance Dashboard
- **Slug**: `indent-delivery-compliance`
- **Color scheme**: `supersetColors`
- **Cross-filters**: Enabled
- **Label colors**: On Time `#1FA8C9`, Late `#FF5A5F`

## Source Files

| File | Purpose |
|------|---------|
| `superset/chart_configs.md` | Step-by-step chart creation guide |
| `superset/dashboard_export.json` | Importable dashboard JSON export |
| `dashboard/src/components/AdvancedViews.jsx` | 11 advanced views referencing Superset features |
| `dashboard/src/components/SupersetFeatures.jsx` | 12 Superset capabilities documentation |
| `sql/01_schema.sql` | Star schema + materialized view |
| `sql/02_virtual_dataset.sql` | Virtual dataset creation |
| `sql/04_drill_down_queries.sql` | 8 drill-down queries for charts |
| `sql/05_performance_tuning.sql` | Indexes, caching, pg_cron config |
