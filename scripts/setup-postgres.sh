#!/usr/bin/env bash
# Reset PostgreSQL role + database to match .env (WSL, no Docker).
# Run: bash scripts/setup-postgres.sh

set -euo pipefail

DB_USER="user"
DB_PASS="all9s_dev_password"
DB_NAME="all9ssolutions"

echo "==> Installing / starting PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

PG_VER="$(ls -1 /etc/postgresql 2>/dev/null | head -1)"
PG_CONF="/etc/postgresql/${PG_VER}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VER}/main/pg_hba.conf"

echo "==> Allow TCP + password auth (WSL + Windows localhost forward)..."
sudo sed -i "s/^#*listen_addresses.*/listen_addresses = '*'/" "${PG_CONF}"

# Remove old broad rules we may have added, then add one clear rule
sudo sed -i '/^# all9s-setup$/,$ d' "${PG_HBA}" 2>/dev/null || true
sudo tee -a "${PG_HBA}" >/dev/null <<'HBA'

# all9s-setup
host    all    all    0.0.0.0/0               scram-sha-256
host    all    all    ::0/0                   scram-sha-256
HBA

sudo service postgresql restart
sleep 2

echo "==> Port 5432 listeners:"
sudo ss -tlnp | grep 5432 || { echo "ERROR: PostgreSQL is not listening on 5432"; exit 1; }

echo "==> Recreate role and database..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${DB_NAME};
DROP ROLE IF EXISTS "${DB_USER}";
CREATE ROLE "${DB_USER}" WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB;
CREATE DATABASE ${DB_NAME} OWNER "${DB_USER}";
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO "${DB_USER}";
SQL

echo "==> Test login (127.0.0.1)..."
PGPASSWORD="${DB_PASS}" psql -h 127.0.0.1 -p 5432 -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 'ok' AS status, current_user, current_database();"

WSL_IP="$(hostname -I | awk '{print $1}')"
if [[ -n "${WSL_IP}" ]]; then
  echo "==> Test login (${WSL_IP})..."
  PGPASSWORD="${DB_PASS}" psql -h "${WSL_IP}" -p 5432 -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 'ok' AS status;"
fi

echo ""
echo "=============================================="
echo "WSL PostgreSQL is ready."
echo ""
echo "DBeaver on Windows — use EXACTLY:"
echo "  Host:     127.0.0.1"
echo "  Port:     5432"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "  Password: ${DB_PASS}"
echo ""
echo "Delete any old DBeaver connection and create a new one."
echo "If it still fails, Windows may have its own Postgres on 5432."
echo "  PowerShell: Get-Service *postgres*"
echo "  Stop it, or use only WSL after stopping Windows Postgres."
echo "=============================================="
