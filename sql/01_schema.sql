-- ============================================================
-- Indent → Delivery Compliance Dashboard
-- Star Schema for Apache Superset
-- Database: PostgreSQL
-- ============================================================

-- Dimension: Branches
CREATE TABLE IF NOT EXISTS dim_branches (
    branch_id   VARCHAR(20) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    region      VARCHAR(50),
    city        VARCHAR(50),
    state       VARCHAR(50)
);

-- Dimension: Transporters
CREATE TABLE IF NOT EXISTS dim_transporters (
    transporter_id   VARCHAR(20) PRIMARY KEY,
    transporter_name VARCHAR(100) NOT NULL,
    contact_person   VARCHAR(100),
    phone            VARCHAR(20),
    tier             VARCHAR(10)  -- Gold / Silver / Bronze
);

-- Dimension: Routes
CREATE TABLE IF NOT EXISTS dim_routes (
    route_id    VARCHAR(20) PRIMARY KEY,
    origin      VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km NUMERIC(8,2),
    lane_type   VARCHAR(20)  -- Primary / Secondary
);

-- Fact: Indents
CREATE TABLE IF NOT EXISTS fact_indents (
    indent_id        VARCHAR(30) PRIMARY KEY,
    branch_id        VARCHAR(20) NOT NULL REFERENCES dim_branches(branch_id),
    route_id         VARCHAR(20) NOT NULL REFERENCES dim_routes(route_id),
    transporter_id   VARCHAR(20) NOT NULL REFERENCES dim_transporters(transporter_id),
    published_time   TIMESTAMP NOT NULL,
    accepted_time    TIMESTAMP,
    status           VARCHAR(20) NOT NULL,  -- published / accepted / rejected / expired
    indent_month     DATE GENERATED ALWAYS AS (date_trunc('month', published_time)::date) STORED
);

CREATE INDEX idx_indents_branch     ON fact_indents(branch_id);
CREATE INDEX idx_indents_transporter ON fact_indents(transporter_id);
CREATE INDEX idx_indents_route      ON fact_indents(route_id);
CREATE INDEX idx_indents_month      ON fact_indents(indent_month);

-- Fact: Vehicle Placements
CREATE TABLE IF NOT EXISTS fact_vehicle_placements (
    placement_id          SERIAL PRIMARY KEY,
    indent_id             VARCHAR(30) NOT NULL REFERENCES fact_indents(indent_id),
    vehicle_id            VARCHAR(20) NOT NULL,
    vehicle_type          VARCHAR(30),
    placement_time        TIMESTAMP NOT NULL,
    planned_placement_time TIMESTAMP NOT NULL
);

CREATE INDEX idx_placements_indent ON fact_vehicle_placements(indent_id);

-- Fact: Trips
CREATE TABLE IF NOT EXISTS fact_trips (
    trip_id               VARCHAR(30) PRIMARY KEY,
    indent_id             VARCHAR(30) NOT NULL REFERENCES fact_indents(indent_id),
    vehicle_id            VARCHAR(20) NOT NULL,
    transporter_id        VARCHAR(20) NOT NULL REFERENCES dim_transporters(transporter_id),
    route_id              VARCHAR(20) NOT NULL REFERENCES dim_routes(route_id),
    branch_id             VARCHAR(20) NOT NULL REFERENCES dim_branches(branch_id),
    trip_created_at       TIMESTAMP NOT NULL,
    planned_delivery_time TIMESTAMP NOT NULL,
    actual_delivery_time  TIMESTAMP,
    trip_status           VARCHAR(20) NOT NULL,  -- created / in_transit / delivered / cancelled
    trip_month            DATE GENERATED ALWAYS AS (date_trunc('month', trip_created_at)::date) STORED
);

CREATE INDEX idx_trips_branch      ON fact_trips(branch_id);
CREATE INDEX idx_trips_transporter ON fact_trips(transporter_id);
CREATE INDEX idx_trips_route       ON fact_trips(route_id);
CREATE INDEX idx_trips_month       ON fact_trips(trip_month);

-- ============================================================
-- Materialized View: Lifecycle Summary (for dashboard perf)
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_lifecycle_summary AS
SELECT
    b.branch_name,
    t.transporter_name,
    r.origin || ' → ' || r.destination AS route_name,
    r.route_id,
    fi.branch_id,
    fi.transporter_id,
    TO_CHAR(date_trunc('month', fi.published_time), 'YYYY-MM') AS month_key,
    TO_CHAR(date_trunc('month', fi.published_time), 'Mon YYYY') AS month_label,
    date_trunc('month', fi.published_time)::date AS month_date,

    -- Indent KPIs
    COUNT(DISTINCT fi.indent_id)
        AS indents_published,
    COUNT(DISTINCT fi.transporter_id)
        AS transporters_published_to,
    COUNT(DISTINCT CASE WHEN fi.status = 'accepted' THEN fi.indent_id END)
        AS indents_accepted,

    -- Placement KPIs
    COUNT(DISTINCT vp.vehicle_id)
        AS vehicles_placed,
    COUNT(DISTINCT CASE WHEN vp.placement_time <= vp.planned_placement_time THEN vp.vehicle_id END)
        AS vehicles_placed_on_time,
    COUNT(DISTINCT CASE WHEN vp.placement_time > vp.planned_placement_time THEN vp.vehicle_id END)
        AS vehicles_placed_late,

    -- Trip KPIs
    COUNT(DISTINCT ft.trip_id)
        AS trips_created,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time <= ft.planned_delivery_time THEN ft.trip_id END)
        AS trips_on_time,
    COUNT(DISTINCT CASE WHEN ft.actual_delivery_time > ft.planned_delivery_time THEN ft.trip_id END)
        AS trips_late

FROM fact_indents fi
LEFT JOIN fact_vehicle_placements vp ON vp.indent_id = fi.indent_id
LEFT JOIN fact_trips ft              ON ft.indent_id = fi.indent_id
JOIN dim_branches b                  ON b.branch_id = fi.branch_id
JOIN dim_transporters t              ON t.transporter_id = fi.transporter_id
JOIN dim_routes r                    ON r.route_id = fi.route_id
GROUP BY 1,2,3,4,5,6,7,8,9;

CREATE UNIQUE INDEX idx_mv_lifecycle_pk
    ON mv_lifecycle_summary(branch_id, transporter_id, route_id, month_key);

-- Refresh command (schedule via cron or Superset SQL Lab)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lifecycle_summary;
