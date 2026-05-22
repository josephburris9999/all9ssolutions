# PostgreSQL troubleshooting

## password authentication failed for user "user"

You are reaching **a** PostgreSQL server, but the password does not match **that** server's `user` account.

### Step 1 — Reset WSL Postgres (run in Ubuntu/WSL)

```bash
cd ~/workspaces/all9s/all9ssolutions
bash scripts/setup-postgres.sh
```

You must see `ok` in the test output. If the script fails, paste the full terminal output.

### Step 2 — DBeaver: new connection (do not edit old one)

1. **Delete** the old PostgreSQL connection in DBeaver.
2. **Database → New Database Connection → PostgreSQL**
3. Enter **exactly**:

| Field | Value |
|--------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| Database | `all9ssolutions` |
| Username | `user` |
| Password | `all9s_dev_password` |

4. Uncheck "Save password" first, test, then save if it works.
5. **Test Connection**

Do **not** use the WSL IP (`172.x.x.x`) unless `setup-postgres.sh` succeeded and you need it.

### Step 3 — Windows may have a different Postgres on port 5432

DBeaver on **Windows** using `127.0.0.1` often connects to **Windows** PostgreSQL, not WSL.

**PowerShell (Windows):**

```powershell
Get-Service *postgres*
netstat -ano | findstr :5432
```

If a **Windows** PostgreSQL service is running:

- **Option A:** Stop it (WSL Postgres only):

  ```powershell
  Stop-Service postgresql-x64-*
  ```

  Then use DBeaver with `127.0.0.1` again (WSL forwards 5432).

- **Option B:** Create `user` on **Windows** Postgres (if you want to keep Windows Postgres):

  Open **SQL Shell (psql)** from Start menu as Windows PostgreSQL, then:

  ```sql
  CREATE USER "user" WITH PASSWORD 'all9s_dev_password' CREATEDB;
  CREATE DATABASE all9ssolutions OWNER "user";
  ```

### Step 4 — Diagnose

```bash
bash scripts/diagnose-postgres.sh
```

| Result in WSL | DBeaver |
|---------------|---------|
| `SELECT 1` works | Wrong host (Windows vs WSL) or stale DBeaver password |
| `SELECT 1` fails | Run `setup-postgres.sh` again |

### Fallback — use `postgres` superuser (WSL only)

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'all9s_dev_password';"
```

DBeaver: Username `postgres`, same password, database `all9ssolutions`.

Update `.env`:

```env
DATABASE_URL="postgresql://postgres:all9s_dev_password@localhost:5432/all9ssolutions?schema=public"
```
