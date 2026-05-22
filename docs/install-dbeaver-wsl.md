# Install DBeaver in WSL (Ubuntu)

Official sources:

- [DBeaver Community download](https://dbeaver.io/download/)
- [Installation wiki](https://github.com/dbeaver/dbeaver/wiki/Installation)
- [Workspace location](https://github.com/dbeaver/dbeaver/wiki/Workspace-Location) (fix permission errors)

## Requirements

- **WSL2** with **GUI support** (Windows 11 WSLg, or Windows 10 + VcXsrv / X410)
- Ubuntu packages: `curl`, `sudo`

## Install (official Debian package)

Run in **Ubuntu/WSL**:

```bash
cd /tmp
curl -fsSL -o dbeaver-ce.deb "https://dbeaver.io/files/dbeaver-ce_latest_amd64.deb"
sudo dpkg -i dbeaver-ce.deb
sudo apt-get install -f -y
```

From [dbeaver.io/download](https://dbeaver.io/download/): after `dpkg`, run `dbeaver &`.

## Launch

```bash
dbeaver &
```

If the window does not appear, enable WSLg (Windows 11) or install an X server on Windows and set:

```bash
export DISPLAY=$(grep -m1 nameserver /etc/resolv.conf | awk '{print $2}'):0
dbeaver &
```

## Avoid workspace permission errors

Do not run DBeaver from `Program Files` or a read-only directory. Workspace data belongs under:

`~/.local/share/DBeaverData/workspace6` (Linux default per [wiki](https://github.com/dbeaver/dbeaver/wiki/Workspace-Location))

If needed:

```bash
dbeaver -data "$HOME/.local/share/DBeaverData/workspace6" &
```

## Connect to this project's PostgreSQL

| Field | Value |
|--------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| Database | `all9ssolutions` |
| Username | `user` |
| Password | `all9s_dev_password` |

Ensure Postgres is ready first:

```bash
cd ~/workspaces/all9s/all9ssolutions
bash scripts/setup-postgres.sh
```

## Uninstall

```bash
sudo apt-get remove dbeaver-ce
```
