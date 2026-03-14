-- ============================================================
-- Seed Data: Realistic synthetic data for POC testing
-- Covers Oct 2025 → Feb 2026 (5 months)
-- ~8 branches, 10 transporters, 15 routes, ~1200 indents
-- ============================================================

-- Branches
INSERT INTO dim_branches (branch_id, branch_name, region, city, state) VALUES
('BR001', 'Chennai Central',   'South',  'Chennai',    'Tamil Nadu'),
('BR002', 'Bangalore Hub',     'South',  'Bangalore',  'Karnataka'),
('BR003', 'Hyderabad DC',      'South',  'Hyderabad',  'Telangana'),
('BR004', 'Mumbai West',       'West',   'Mumbai',     'Maharashtra'),
('BR005', 'Pune Logistics',    'West',   'Pune',       'Maharashtra'),
('BR006', 'Delhi NCR',         'North',  'New Delhi',  'Delhi'),
('BR007', 'Kolkata East',      'East',   'Kolkata',    'West Bengal'),
('BR008', 'Ahmedabad West',    'West',   'Ahmedabad',  'Gujarat');

-- Transporters
INSERT INTO dim_transporters (transporter_id, transporter_name, contact_person, phone, tier) VALUES
('TR001', 'SafeExpress Logistics',   'Rajesh Kumar',    '9876543210', 'Gold'),
('TR002', 'BlueDart Freight',        'Anita Sharma',    '9876543211', 'Gold'),
('TR003', 'Gati Transport',          'Suresh Patel',    '9876543212', 'Silver'),
('TR004', 'TCI Express',             'Priya Menon',     '9876543213', 'Silver'),
('TR005', 'Rivigo Fleet',            'Amit Verma',      '9876543214', 'Gold'),
('TR006', 'Delhivery Cargo',         'Neha Gupta',      '9876543215', 'Silver'),
('TR007', 'VRL Logistics',           'Mohan Das',       '9876543216', 'Bronze'),
('TR008', 'Om Logistics',            'Kavita Singh',    '9876543217', 'Bronze'),
('TR009', 'Ecom Express',            'Ravi Shankar',    '9876543218', 'Silver'),
('TR010', 'XpressBees Cargo',        'Deepa Nair',      '9876543219', 'Bronze');

-- Routes
INSERT INTO dim_routes (route_id, origin, destination, distance_km, lane_type) VALUES
('RT001', 'Chennai',    'Bangalore',   350,  'Primary'),
('RT002', 'Chennai',    'Hyderabad',   630,  'Primary'),
('RT003', 'Mumbai',     'Pune',        150,  'Primary'),
('RT004', 'Mumbai',     'Ahmedabad',   530,  'Primary'),
('RT005', 'Delhi',      'Kolkata',     1530, 'Primary'),
('RT006', 'Bangalore',  'Hyderabad',   570,  'Secondary'),
('RT007', 'Pune',       'Hyderabad',   560,  'Secondary'),
('RT008', 'Delhi',      'Mumbai',      1420, 'Primary'),
('RT009', 'Chennai',    'Mumbai',      1340, 'Primary'),
('RT010', 'Kolkata',    'Chennai',     1670, 'Secondary'),
('RT011', 'Bangalore',  'Pune',        840,  'Secondary'),
('RT012', 'Ahmedabad',  'Delhi',       950,  'Primary'),
('RT013', 'Hyderabad',  'Mumbai',      710,  'Secondary'),
('RT014', 'Delhi',      'Bangalore',   2150, 'Secondary'),
('RT015', 'Chennai',    'Delhi',       2180, 'Primary');

-- ============================================================
-- Generate Indents, Placements, Trips using procedural PL/pgSQL
-- ============================================================
DO $$
DECLARE
    v_branches   TEXT[] := ARRAY['BR001','BR002','BR003','BR004','BR005','BR006','BR007','BR008'];
    v_transporters TEXT[] := ARRAY['TR001','TR002','TR003','TR004','TR005','TR006','TR007','TR008','TR009','TR010'];
    v_routes     TEXT[] := ARRAY['RT001','RT002','RT003','RT004','RT005','RT006','RT007','RT008','RT009','RT010','RT011','RT012','RT013','RT014','RT015'];
    v_statuses   TEXT[] := ARRAY['accepted','accepted','accepted','accepted','rejected','expired'];

    v_branch     TEXT;
    v_transporter TEXT;
    v_route      TEXT;
    v_status     TEXT;
    v_month_start DATE;
    v_pub_time   TIMESTAMP;
    v_acc_time   TIMESTAMP;
    v_indent_id  TEXT;
    v_vehicle_id TEXT;
    v_trip_id    TEXT;
    v_planned_place TIMESTAMP;
    v_actual_place  TIMESTAMP;
    v_planned_del   TIMESTAMP;
    v_actual_del    TIMESTAMP;
    v_counter    INT := 0;
    v_month_idx  INT;
    v_indents_per_combo INT;
BEGIN
    -- For each month from Oct 2025 to Feb 2026
    FOR v_month_idx IN 0..4 LOOP
        v_month_start := '2025-10-01'::date + (v_month_idx * interval '1 month');

        -- Each branch x random transporters x random routes
        FOR b_idx IN 1..array_length(v_branches, 1) LOOP
            v_branch := v_branches[b_idx];

            -- Each branch has 3-5 transporter combos per month
            FOR t_round IN 1..( 3 + floor(random()*3)::int ) LOOP
                v_transporter := v_transporters[ 1 + floor(random() * array_length(v_transporters, 1))::int ];
                v_route := v_routes[ 1 + floor(random() * array_length(v_routes, 1))::int ];

                -- 3-8 indents per combo per month
                v_indents_per_combo := 3 + floor(random()*6)::int;

                FOR i IN 1..v_indents_per_combo LOOP
                    v_counter := v_counter + 1;
                    v_indent_id := 'IND-' || LPAD(v_counter::text, 6, '0');

                    -- Random publish time within the month
                    v_pub_time := v_month_start + (random() * 27 || ' days')::interval
                                  + (random() * 12 + 6 || ' hours')::interval;

                    -- Random status (weighted: ~67% accepted)
                    v_status := v_statuses[ 1 + floor(random() * array_length(v_statuses, 1))::int ];

                    -- Accepted time (1-6 hours after publish)
                    IF v_status = 'accepted' THEN
                        v_acc_time := v_pub_time + ((1 + random()*5) || ' hours')::interval;
                    ELSE
                        v_acc_time := NULL;
                    END IF;

                    INSERT INTO fact_indents (indent_id, branch_id, route_id, transporter_id, published_time, accepted_time, status)
                    VALUES (v_indent_id, v_branch, v_route, v_transporter, v_pub_time, v_acc_time, v_status);

                    -- Vehicle Placement (only for accepted indents)
                    IF v_status = 'accepted' THEN
                        v_vehicle_id := 'VH-' || LPAD(v_counter::text, 5, '0');
                        v_planned_place := v_acc_time + (interval '4 hours');

                        -- 70% on time, 30% late
                        IF random() < 0.70 THEN
                            v_actual_place := v_planned_place - ((random()*2) || ' hours')::interval;
                        ELSE
                            v_actual_place := v_planned_place + ((1 + random()*6) || ' hours')::interval;
                        END IF;

                        INSERT INTO fact_vehicle_placements (indent_id, vehicle_id, vehicle_type, placement_time, planned_placement_time)
                        VALUES (v_indent_id, v_vehicle_id,
                                (ARRAY['20ft', '32ft', '40ft', 'Container'])[1 + floor(random()*4)::int],
                                v_actual_place, v_planned_place);

                        -- Trip (90% of placed vehicles get a trip)
                        IF random() < 0.90 THEN
                            v_trip_id := 'TRP-' || LPAD(v_counter::text, 6, '0');

                            v_planned_del := v_actual_place + ((24 + random()*72) || ' hours')::interval;

                            -- 65% on time, 35% late
                            IF random() < 0.65 THEN
                                v_actual_del := v_planned_del - ((random()*8) || ' hours')::interval;
                            ELSE
                                v_actual_del := v_planned_del + ((2 + random()*48) || ' hours')::interval;
                            END IF;

                            INSERT INTO fact_trips (trip_id, indent_id, vehicle_id, transporter_id, route_id, branch_id,
                                                    trip_created_at, planned_delivery_time, actual_delivery_time, trip_status)
                            VALUES (v_trip_id, v_indent_id, v_vehicle_id, v_transporter, v_route, v_branch,
                                    v_actual_place + (interval '30 minutes'),
                                    v_planned_del, v_actual_del, 'delivered');
                        END IF;
                    END IF;

                END LOOP; -- indents per combo
            END LOOP; -- transporter rounds
        END LOOP; -- branches
    END LOOP; -- months

    RAISE NOTICE 'Seeded % indents across 5 months', v_counter;
END $$;

-- Refresh materialized view after seeding
REFRESH MATERIALIZED VIEW mv_lifecycle_summary;

-- Quick validation
SELECT
    'Indents' AS entity, COUNT(*) AS cnt FROM fact_indents
UNION ALL
SELECT 'Placements', COUNT(*) FROM fact_vehicle_placements
UNION ALL
SELECT 'Trips', COUNT(*) FROM fact_trips
UNION ALL
SELECT 'MV Rows', COUNT(*) FROM mv_lifecycle_summary;
