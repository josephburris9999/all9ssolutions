# all9s Solutions

Next.js marketing site with a consultation form.

## Development

Requires PostgreSQL. See [docs/prisma.md](docs/prisma.md) to install Postgres on WSL and create the `user` / `all9ssolutions` database, then:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Optional: `docker compose up -d` if Docker is installed.

See [docs/prisma.md](docs/prisma.md) for database and ORM details.

To get started with the UI, see `src/app/page.tsx`.
