-- ============================================================
-- Performance Tuning for 10M+ Rows
-- ============================================================

-- 1. Partitioning: Partition fact tables by month for query pruning
-- (Apply BEFORE loading production data; seed script uses unpartitioned tables)

-- Example: Partition fact_trips by month
/*
CREATE TABLE fact_trips_partitioned (
    LIKE fact_trips INCLUDING ALL
) PARTITION BY RANGE (trip_created_at);

CREATE TABLE fact_trips_2025_10 PARTITION OF fact_trips_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE fact_trips_2025_11 PARTITION OF fact_trips_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
-- ... add monthly partitions as needed
*/

-- 2. Materialized View Refresh Schedule
-- Run via pg_cron or external cron job
-- Recommended: every 4 hours during business hours

/*
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'refresh_lifecycle_mv',
    '0 6,10,14,18 * * 1-5',  -- 6am, 10am, 2pm, 6pm on weekdays
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lifecycle_summary'
);
*/

-- 3. Statistics and Analyze
ANALYZE fact_indents;
ANALYZE fact_vehicle_placements;
ANALYZE fact_trips;
ANALYZE mv_lifecycle_summary;

-- 4. Query-specific indexes for common filter patterns
CREATE INDEX IF NOT EXISTS idx_mv_branch_month
    ON mv_lifecycle_summary(branch_name, month_date);

CREATE INDEX IF NOT EXISTS idx_mv_transporter_month
    ON mv_lifecycle_summary(transporter_name, month_date);

CREATE INDEX IF NOT EXISTS idx_mv_route_month
    ON mv_lifecycle_summary(route_name, month_date);

-- 5. Superset Caching Configuration
-- Set in superset_config.py:
/*
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,        # 5 minutes
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': 'localhost',
    'CACHE_REDIS_PORT': 6379,
    'CACHE_REDIS_DB': 1,
}

DATA_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 600,        # 10 minutes for query results
    'CACHE_KEY_PREFIX': 'superset_data_',
    'CACHE_REDIS_HOST': 'localhost',
    'CACHE_REDIS_PORT': 6379,
    'CACHE_REDIS_DB': 2,
}
*/

-- 6. PostgreSQL config recommendations for analytical workloads
/*
-- postgresql.conf
shared_buffers = '4GB'            -- 25% of RAM
effective_cache_size = '12GB'     -- 75% of RAM
work_mem = '256MB'                -- for complex aggregations
maintenance_work_mem = '1GB'      -- for REFRESH MATERIALIZED VIEW
random_page_cost = 1.1            -- if using SSD
max_parallel_workers_per_gather = 4
*/
