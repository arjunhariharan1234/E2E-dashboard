# Superset Chart Configuration Guide

Step-by-step instructions to recreate each chart in Superset UI.

---

## Prerequisites
- Dataset `mv_lifecycle_summary` registered in Superset (via SQL Lab → Save as Dataset)
- All 4 native filters created (Date Range, Branch, Transporter, Route)

---

## Section 1: Lifecycle Scorecard (6 KPI Cards)

### Chart 1 — Total Indents Published
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Dataset | mv_lifecycle_summary |
| Metric | `SUM(indents_published)` |
| Subheader | "Total Indents" |
| Number Format | Smart Number |

### Chart 2 — Indent Acceptance Rate
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Dataset | mv_lifecycle_summary |
| Metric | `ROUND(SUM(indents_accepted)::numeric / NULLIF(SUM(indents_published), 0) * 100, 1)` |
| Subheader | "Acceptance %" |
| Number Format | `.1f` |

### Chart 3 — Vehicles Placed
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Metric | `SUM(vehicles_placed)` |

### Chart 4 — Placement On Time %
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Metric | `ROUND(SUM(vehicles_placed_on_time)::numeric / NULLIF(SUM(vehicles_placed), 0) * 100, 1)` |
| Number Format | `.1f` |

### Chart 5 — Total Trips
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Metric | `SUM(trips_created)` |

### Chart 6 — OTD Rate
| Setting | Value |
|---------|-------|
| Chart Type | Big Number |
| Metric | `ROUND(SUM(trips_on_time)::numeric / NULLIF(SUM(trips_created), 0) * 100, 1)` |
| Number Format | `.1f` |

---

## Section 2: Branch Performance

### Chart 7 — Branch Stacked Bar
| Setting | Value |
|---------|-------|
| Chart Type | Bar Chart (ECharts) |
| Dataset | mv_lifecycle_summary |
| X-Axis | `branch_name` |
| Metrics | `SUM(trips_on_time)` as "On Time", `SUM(trips_late)` as "Late" |
| Stack | ✅ Enabled |
| Sort | Descending by total |
| Legend | ✅ Visible |

---

## Section 3: Transporter Performance

### Chart 8 — Transporter Scorecard Table
| Setting | Value |
|---------|-------|
| Chart Type | Table |
| Dataset | mv_lifecycle_summary |
| Group By | `transporter_name` |
| Columns/Metrics | See below |

**Metrics:**
1. `SUM(indents_published)` → "Indents Published"
2. `SUM(indents_accepted)` → "Indents Accepted"
3. `ROUND(SUM(indents_accepted)::numeric / NULLIF(SUM(indents_published),0)*100, 1)` → "Acceptance %"
4. `SUM(vehicles_placed)` → "Vehicles Placed"
5. `ROUND(SUM(vehicles_placed_on_time)::numeric / NULLIF(SUM(vehicles_placed),0)*100, 1)` → "Placement On Time %"
6. `SUM(trips_created)` → "Trips Delivered"
7. `ROUND(SUM(trips_on_time)::numeric / NULLIF(SUM(trips_created),0)*100, 1)` → "OTD %"

**Conditional Formatting:**
| Column | Condition | Color |
|--------|-----------|-------|
| Acceptance % | < 60 | 🔴 Red (#FF5A5F) |
| Acceptance % | ≥ 80 | 🔵 Blue (#1FA8C9) |
| Placement On Time % | < 60 | 🔴 Red |
| Placement On Time % | ≥ 80 | 🔵 Blue |
| OTD % | < 60 | 🔴 Red |
| OTD % | ≥ 80 | 🔵 Blue |

### Chart 9 — Transporter Indent Fulfilment (Grouped Bar)
| Setting | Value |
|---------|-------|
| Chart Type | Bar Chart (ECharts) |
| X-Axis | `transporter_name` |
| Metrics | `SUM(indents_accepted)` as "Accepted", `SUM(indents_published) - SUM(indents_accepted)` as "Not Accepted" |
| Stack | ❌ Disabled (grouped) |
| Legend | ✅ Visible |

---

## Section 4: Route Analysis

### Chart 10 — Route On Time vs Late (Stacked Bar)
| Setting | Value |
|---------|-------|
| Chart Type | Bar Chart (ECharts) |
| X-Axis | `route_name` |
| Metrics | `SUM(trips_on_time)` as "On Time", `SUM(trips_late)` as "Late" |
| Stack | ✅ Enabled |
| Row Limit | 50 |

---

## Section 5: MoM Trends

### Chart 11 — MoM Transporter Performance (Line Chart)
| Setting | Value |
|---------|-------|
| Chart Type | Time-series Line Chart (ECharts) |
| X-Axis | `month_date` |
| Time Grain | Month |
| Series | `transporter_name` |
| Metrics | OTD %, Placement %, Acceptance % (same SQL as KPI cards) |
| X-Axis Format | `%b %Y` (e.g., "Oct 2025") |
| Y-Axis Format | `.1f` |
| Markers | ✅ Enabled, size 6 |

### Chart 12 — Route OTD Heatmap
| Setting | Value |
|---------|-------|
| Chart Type | Heatmap |
| X-Axis | `route_name` |
| Y-Axis | `month_label` |
| Metric | OTD % |
| Color Scheme | Sequential (superset_seq_1) |
| Show Values | ✅ |
| Value Format | `.0f` |

---

## Section 6: Native Filters

Create in **Dashboard → Edit → Filters Panel**:

| Filter | Type | Column | Multi-select | Scope |
|--------|------|--------|-------------|-------|
| Date Range | Time Filter | `month_date` | N/A | All charts |
| Branch | Value Filter | `branch_name` | ✅ | All charts |
| Transporter | Value Filter | `transporter_name` | ✅ | All charts |
| Route | Value Filter | `route_name` | ✅ | All charts |

---

## Section 7: Drill Down Configuration

Superset supports drill-down via **Cross-filters** and **Dashboard URL params**.

### Hierarchy: Branch → Transporter → Route → Trip Details

1. Enable **Cross-filtering** on the dashboard (Settings → Cross-filter scoping)
2. On the Branch Stacked Bar chart: clicking a branch filters the Transporter Table
3. On the Transporter Table: clicking a transporter filters the Route Bar chart
4. For Trip Detail drill-down: create a separate **Table chart** using the Trip Detail query from `04_drill_down_queries.sql` (Query #8)

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Indents] [Accept%] [Vehicles] [Place%] [Trips] [OTD%]│  ← KPI Row
├─────────────────────────────────────────────────────────┤
│  Branch Performance — Stacked Bar                       │
├────────────────────────────┬────────────────────────────┤
│  Transporter Scorecard     │  Transporter Fulfilment    │
│  (Table)                   │  (Grouped Bar)             │
├────────────────────────────┴────────────────────────────┤
│  Route Level — On Time vs Late (Stacked Bar)            │
├────────────────────────────┬────────────────────────────┤
│  MoM Transporter Trends    │  Route OTD Heatmap         │
│  (Line Chart)              │  (Heatmap)                 │
└────────────────────────────┴────────────────────────────┘
```
