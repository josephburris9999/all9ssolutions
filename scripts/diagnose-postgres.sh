#!/usr/bin/env bash
# Print PostgreSQL connection diagnostics. Run in WSL.
set -u

echo "=== WSL PostgreSQL service ==="
sudo service postgresql status 2>&1 | head -5 || true

echo ""
echo "=== Port 5432 ==="
sudo ss -tlnp | grep 5432 || echo "(nothing listening)"

echo ""
echo "=== Roles ==="
sudo -u postgres psql -tAc "SELECT rolname FROM pg_roles ORDER BY 1;" 2>&1 || true

echo ""
echo "=== Databases ==="
sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY 1;" 2>&1 || true

echo ""
echo "=== pg_hba.conf (host lines) ==="
HBA="/etc/postgresql/$(ls -1 /etc/postgresql 2>/dev/null | head -1)/main/pg_hba.conf"
grep -E '^(local|host)' "${HBA}" 2>/dev/null | tail -15 || true

echo ""
echo "=== Password test (user / all9ssolutions) ==="
PGPASSWORD=all9s_dev_password psql -h 127.0.0.1 -U user -d all9ssolutions -c "SELECT 1;" 2>&1 || true

echo ""
echo "=== WSL IP ==="
hostname -I

echo ""
echo "If password test fails here, run: bash scripts/setup-postgres.sh"
echo "If it succeeds here but DBeaver fails, Windows Postgres may be on port 5432 instead."
