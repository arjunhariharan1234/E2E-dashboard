-- ============================================================
-- Superset Virtual Dataset
-- Use this SQL when creating the dataset in Superset:
--   Data → Datasets → + Dataset → SQL Lab → Save as Virtual Dataset
-- ============================================================

-- Option A: Query the materialized view (recommended for perf)
SELECT
    branch_name,
    transporter_name,
    route_name,
    route_id,
    branch_id,
    transporter_id,
    month_key,
    month_label,
    month_date,

    indents_published,
    transporters_published_to,
    indents_accepted,
    ROUND(indents_accepted::numeric / NULLIF(indents_published, 0) * 100, 1) AS acceptance_rate,

    vehicles_placed,
    vehicles_placed_on_time,
    vehicles_placed_late,
    ROUND(vehicles_placed_on_time::numeric / NULLIF(vehicles_placed, 0) * 100, 1) AS placement_compliance_rate,

    trips_created,
    trips_on_time,
    trips_late,
    ROUND(trips_on_time::numeric / NULLIF(trips_created, 0) * 100, 1) AS otd_rate

FROM mv_lifecycle_summary
ORDER BY month_date DESC, branch_name, transporter_name;


-- ============================================================
-- Option B: Live query (no materialized view, slower on 10M+ rows)
-- ============================================================
/*
SELECT
    b.branch_name,
    t.transporter_name,
    r.origin || ' → ' || r.destination AS route_name,
    r.route_id,
    fi.branch_id,
    fi.transporter_id,
    TO_CHAR(date_trunc('month', fi.published_time), 'Mon YYYY') AS month_label,
    date_trunc('month', fi.published_time)::date AS month_date,

    COUNT(DISTINCT fi.indent_id) AS indents_published,
    COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END) AS indents_accepted,
    ROUND(
        COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END)::numeric
        / NULLIF(COUNT(DISTINCT fi.indent_id), 0) * 100, 1
    ) AS acceptance_rate,

    COUNT(DISTINCT vp.vehicle_id) AS vehicles_placed,
    COUNT(DISTINCT CASE WHEN vp.placement_time <= vp.planned_placement_time THEN vp.vehicle_id END) AS vehicles_placed_on_time,
    ROUND(
        COUNT(DISTINCT CASE WHEN vp.placement_time <= vp.planned_placement_time THEN vp.vehicle_id END)::numeric
        / NULLIF(COUNT(DISTINCT vp.vehicle_id), 0) * 100, 1
    ) AS placement_compliance_rate,

    COUNT(DISTINCT ft.trip_id) AS trips_created,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END) AS trips_on_time,
    ROUND(
        COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END)::numeric
        / NULLIF(COUNT(DISTINCT ft.trip_id), 0) * 100, 1
    ) AS otd_rate

FROM fact_indents fi
LEFT JOIN fact_vehicle_placements vp ON vp.indent_id = fi.indent_id
LEFT JOIN fact_trips ft              ON ft.indent_id = fi.indent_id
JOIN dim_branches b                  ON b.branch_id = fi.branch_id
JOIN dim_transporters t              ON t.transporter_id = fi.transporter_id
JOIN dim_routes r                    ON r.route_id = fi.route_id
GROUP BY 1,2,3,4,5,6,7,8
ORDER BY month_date DESC, branch_name, transporter_name;
*/
