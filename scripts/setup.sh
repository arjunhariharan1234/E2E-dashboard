#!/usr/bin/env bash
# ============================================================
# Setup Script: Indent → Delivery Compliance Dashboard
# Prerequisites: PostgreSQL running, psql available
# ============================================================

set -euo pipefail

# ---- Configuration ----
DB_NAME="${DB_NAME:-brakes_india}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

SQL_DIR="$(cd "$(dirname "$0")/../sql" && pwd)"

echo "============================================"
echo " Indent → Delivery Compliance Dashboard"
echo " Database Setup"
echo "============================================"
echo ""
echo "Config:"
echo "  DB_NAME = $DB_NAME"
echo "  DB_USER = $DB_USER"
echo "  DB_HOST = $DB_HOST"
echo "  DB_PORT = $DB_PORT"
echo ""

# ---- Step 1: Create database (if not exists) ----
echo "[1/4] Creating database '$DB_NAME' (if not exists)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"
echo "  ✓ Database ready"

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# ---- Step 2: Create schema ----
echo "[2/4] Creating schema (tables, indexes, materialized view)..."
$PSQL -f "$SQL_DIR/01_schema.sql"
echo "  ✓ Schema created"

# ---- Step 3: Seed data ----
echo "[3/4] Seeding sample data (5 months, ~1200 indents)..."
$PSQL -f "$SQL_DIR/03_seed_data.sql"
echo "  ✓ Data seeded"

# ---- Step 4: Validate ----
echo "[4/4] Validating..."
$PSQL -c "SELECT 'Indents' AS entity, COUNT(*) AS cnt FROM fact_indents
           UNION ALL SELECT 'Placements', COUNT(*) FROM fact_vehicle_placements
           UNION ALL SELECT 'Trips', COUNT(*) FROM fact_trips
           UNION ALL SELECT 'MV Rows', COUNT(*) FROM mv_lifecycle_summary;"

echo ""
echo "============================================"
echo " Setup complete!"
echo ""
echo " Next steps:"
echo "  1. Connect this database to Superset:"
echo "     postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "  2. Register the virtual dataset:"
echo "     SQL Lab → paste sql/02_virtual_dataset.sql → Save as Dataset"
echo ""
echo "  3. Create charts using superset/chart_configs.md"
echo ""
echo "  4. Assemble dashboard layout per the guide"
echo "============================================"
