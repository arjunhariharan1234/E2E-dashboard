-- ============================================================
-- Drill-Down Queries for Superset Charts
-- Use these as SQL datasets or chart-level custom SQL
-- ============================================================

-- ============================================================
-- 1. LIFECYCLE SCORECARD (Big Number KPI Cards)
-- ============================================================
-- Total Indents Published
SELECT COUNT(DISTINCT indent_id) AS total_indents
FROM fact_indents
WHERE published_time BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}';

-- Acceptance Rate
SELECT ROUND(
    COUNT(DISTINCT CASE WHEN status = 'accepted' THEN indent_id END)::numeric
    / NULLIF(COUNT(DISTINCT indent_id), 0) * 100, 1
) AS acceptance_rate
FROM fact_indents
WHERE published_time BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}';

-- Placement Compliance Rate
SELECT ROUND(
    COUNT(DISTINCT CASE WHEN placement_time <= planned_placement_time THEN vehicle_id END)::numeric
    / NULLIF(COUNT(DISTINCT vehicle_id), 0) * 100, 1
) AS placement_compliance_rate
FROM fact_vehicle_placements vp
JOIN fact_indents fi ON fi.indent_id = vp.indent_id
WHERE fi.published_time BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}';

-- OTD Rate
SELECT ROUND(
    COUNT(DISTINCT CASE WHEN actual_delivery_time <= planned_delivery_time THEN trip_id END)::numeric
    / NULLIF(COUNT(DISTINCT trip_id), 0) * 100, 1
) AS otd_rate
FROM fact_trips
WHERE trip_created_at BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}';


-- ============================================================
-- 2. BRANCH PERFORMANCE (Stacked Bar Chart)
-- ============================================================
SELECT
    b.branch_name,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END) AS trips_on_time,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time >  ft.planned_delivery_time THEN ft.trip_id END) AS trips_late
FROM fact_trips ft
JOIN dim_branches b ON b.branch_id = ft.branch_id
WHERE ft.trip_created_at BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
GROUP BY b.branch_name
ORDER BY trips_on_time + trips_late DESC;


-- ============================================================
-- 3. TRANSPORTER SCORECARD (Table + Conditional Formatting)
-- ============================================================
SELECT
    t.transporter_name,
    COUNT(DISTINCT fi.indent_id) AS indents_published,
    COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END) AS indents_accepted,
    ROUND(
        COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END)::numeric
        / NULLIF(COUNT(DISTINCT fi.indent_id), 0) * 100, 1
    ) AS acceptance_pct,
    COUNT(DISTINCT vp.vehicle_id) AS vehicles_placed,
    ROUND(
        COUNT(DISTINCT CASE WHEN vp.placement_time <= vp.planned_placement_time THEN vp.vehicle_id END)::numeric
        / NULLIF(COUNT(DISTINCT vp.vehicle_id), 0) * 100, 1
    ) AS placement_on_time_pct,
    COUNT(DISTINCT ft.trip_id) AS trips_delivered,
    ROUND(
        COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END)::numeric
        / NULLIF(COUNT(DISTINCT ft.trip_id), 0) * 100, 1
    ) AS otd_pct
FROM fact_indents fi
LEFT JOIN fact_vehicle_placements vp ON vp.indent_id = fi.indent_id
LEFT JOIN fact_trips ft              ON ft.indent_id = fi.indent_id
JOIN dim_transporters t              ON t.transporter_id = fi.transporter_id
WHERE fi.published_time BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
GROUP BY t.transporter_name
ORDER BY otd_pct DESC;


-- ============================================================
-- 4. TRANSPORTER FULFILMENT DRILL DOWN (Grouped Bar)
-- ============================================================
SELECT
    t.transporter_name,
    COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END) AS accepted,
    COUNT(DISTINCT CASE WHEN fi.status IN ('rejected','expired') THEN fi.indent_id END) AS not_accepted
FROM fact_indents fi
JOIN dim_transporters t ON t.transporter_id = fi.transporter_id
WHERE fi.published_time BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
GROUP BY t.transporter_name
ORDER BY accepted DESC;


-- ============================================================
-- 5. ROUTE LEVEL DRILL DOWN (Bar Chart)
-- ============================================================
SELECT
    r.origin || ' → ' || r.destination AS route_name,
    b.branch_name,
    t.transporter_name,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END) AS trips_on_time,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time >  ft.planned_delivery_time THEN ft.trip_id END) AS trips_late
FROM fact_trips ft
JOIN dim_routes r       ON r.route_id = ft.route_id
JOIN dim_branches b     ON b.branch_id = ft.branch_id
JOIN dim_transporters t ON t.transporter_id = ft.transporter_id
WHERE ft.trip_created_at BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
GROUP BY 1, 2, 3
ORDER BY trips_late DESC;


-- ============================================================
-- 6. MoM TRANSPORTER PERFORMANCE (Line Chart)
-- ============================================================
SELECT
    TO_CHAR(date_trunc('month', fi.published_time), 'Mon YYYY') AS month_label,
    date_trunc('month', fi.published_time)::date AS month_date,
    t.transporter_name,

    ROUND(
        COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END)::numeric
        / NULLIF(COUNT(DISTINCT fi.indent_id), 0) * 100, 1
    ) AS acceptance_pct,

    ROUND(
        COUNT(DISTINCT CASE WHEN vp.placement_time <= vp.planned_placement_time THEN vp.vehicle_id END)::numeric
        / NULLIF(COUNT(DISTINCT vp.vehicle_id), 0) * 100, 1
    ) AS placement_compliance_pct,

    ROUND(
        COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END)::numeric
        / NULLIF(COUNT(DISTINCT ft.trip_id), 0) * 100, 1
    ) AS otd_pct

FROM fact_indents fi
LEFT JOIN fact_vehicle_placements vp ON vp.indent_id = fi.indent_id
LEFT JOIN fact_trips ft              ON ft.indent_id = fi.indent_id
JOIN dim_transporters t              ON t.transporter_id = fi.transporter_id
GROUP BY 1, 2, 3
ORDER BY month_date, transporter_name;


-- ============================================================
-- 7. ROUTE LEVEL MoM HEATMAP
-- ============================================================
SELECT
    r.origin || ' → ' || r.destination AS route_name,
    TO_CHAR(date_trunc('month', ft.trip_created_at), 'Mon YYYY') AS month_label,
    date_trunc('month', ft.trip_created_at)::date AS month_date,
    ROUND(
        COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END)::numeric
        / NULLIF(COUNT(DISTINCT ft.trip_id), 0) * 100, 1
    ) AS otd_pct
FROM fact_trips ft
JOIN dim_routes r ON r.route_id = ft.route_id
GROUP BY 1, 2, 3
ORDER BY route_name, month_date;


-- ============================================================
-- 8. TRIP DETAIL DRILL DOWN (Final Level)
-- ============================================================
SELECT
    ft.trip_id,
    ft.vehicle_id,
    t.transporter_name,
    b.branch_name,
    r.origin || ' → ' || r.destination AS route_name,
    ft.planned_delivery_time,
    ft.actual_delivery_time,
    EXTRACT(EPOCH FROM (ft.actual_delivery_time - ft.planned_delivery_time)) / 60 AS delay_minutes,
    CASE
        WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN 'On Time'
        ELSE 'Late'
    END AS delivery_status
FROM fact_trips ft
JOIN dim_transporters t ON t.transporter_id = ft.transporter_id
JOIN dim_branches b     ON b.branch_id = ft.branch_id
JOIN dim_routes r       ON r.route_id = ft.route_id
WHERE ft.trip_created_at BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
ORDER BY delay_minutes DESC;
