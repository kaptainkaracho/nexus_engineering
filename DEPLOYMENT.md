# Deployment — Nexus Engineering

## Railway (Default)

Single service per repo: the pnpm workspace cannot resolve per-app build roots,
so the Fastify backend also serves the built Vite SPA from the same origin
(`/health` for health checks, `/api/*` for the API, everything else → `index.html`).

### Files

- `railway.toml` — Nixpacks build (frontend), start command (backend via `tsx`),
  `/health` healthcheck, `ON_FAILURE` restart policy, and a required persistent
  volume mounted at `/data`.
- `.github/workflows/deploy.yml` — pushes to `main` (or manual dispatch) build and
  `railway up --detach` the single service.

### Required secrets (GitHub repo → Settings → Secrets)

| Secret | Purpose |
|--------|---------|
| `RAILWAY_TOKEN` | CLI auth token |
| `RAILWAY_PROJECT_ID` | Target Railway project |

### Environment variables

| Variable | Default (Railway) | Notes |
|----------|-------------------|-------|
| `NODE_ENV` | `production` | Set in `railway.toml`. |
| `DATABASE_PATH` | `/data/nexus.db` | SQLite file on the persistent volume. Two files are created: `<path>.trace` and `<path>.artifacts`. Unset ⇒ in-memory DB. |
| `PORT` | injected by Railway | Backend binds `0.0.0.0` + this port. Do not hardcode. |
| `CORS_ORIGIN` | unset (reflect) | Only needed if the SPA is served from a different origin. |
| `VITE_API_URL` | empty (same-origin) | Build-time only. Empty ⇒ frontend calls `/api/*` on its own origin. |

### Volume (persistence)

`railway.toml` declares `requiredMountPath = "/data"`. Attach a volume at `/data`
in the Railway dashboard (Project → Volumes → create, mount `/data`). Without it
the deploy fails fast. SQLite data (trace links + artifacts) survives restarts.

### Environments (staging + production)

Railway environments are created in the dashboard (or `railway environment create staging`).
`deploy.yml` deploys to the environment selected on manual dispatch (`preview`|`production`),
or `preview` on push to `main`. To add staging:

```bash
railway environment create staging
railway up --detach --environment staging
```

Both environments share the same `railway.toml`; only `RAILWAY_ENVIRONMENT` differs.

### First deploy

1. Set the two GitHub secrets above.
2. In Railway, create the project and a volume mounted at `/data`.
3. Push to `main` (or run the workflow manually) → service builds and goes healthy
   once `/health` returns 200.

### Live status (THE-175)

- **Production** — deployed & verified:
  - URL: `https://nexus-engineering-production.up.railway.app`
  - `/health` → 200, SPA `/` → 200, `/api/requirements` & `/api/artifacts/registry` → 200
  - Persistent volume `nexus-engineering-volume` mounted at `/data` (SQLite at
    `/data/nexus.db.trace` + `/data/nexus.db.artifacts`).
- **Staging environment** — created (`staging`). Instantiate its service (Railway
  dashboard → New Service → existing repo, or `railway up` once the CLI creates the
  service in that env) and `railway up --environment staging`. It reuses this same
  `railway.toml` (no per-env config needed).

### Verify

```bash
curl https://nexus-engineering-production.up.railway.app/health   # { "status": "ok" }
curl https://nexus-engineering-production.up.railway.app/api/requirements
```

## Self-Hosted (Docker Compose)

For local development or on-premise deployment, use Docker Compose.

### Quick Start

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and other vars as needed
docker compose up -d
# Verify
curl http://localhost:3001/health   # { "status": "ok" }
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `nexus-backend` | 3001 | Fastify API + static SPA frontend |
| `nexus-postgres` | 5432 | PostgreSQL (optional — backend uses SQLite by default) |

### Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Multi-service orchestration |
| `Dockerfile` | Backend container build (Node.js + npm) |
| `.env.example` | Template for environment variables |
| `.env` | Local env overrides (not committed) |

### Environment Variables (Self-Hosted)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `/data/nexus.db` | SQLite file on persistent volume |
| `DATABASE_URL` | unset | Postgres connection string — set to use Postgres instead of SQLite |
| `POSTGRES_HOST` | `postgres` | Postgres container hostname |
| `POSTGRES_PORT` | `5432` | Postgres port |
| `POSTGRES_DB` | `nexus` | Postgres database name |
| `POSTGRES_USER` | `nexus` | Postgres user |
| `POSTGRES_PASSWORD` | — | **Must be set** if using Postgres |
| `VITE_API_URL` | `http://localhost:3001` | Frontend API base URL |

### Persistence

Docker volumes `nexus-data` (SQLite/backend data) and `postgres-data` (Postgres storage)
are defined in `docker-compose.yml`. Data survives container restarts but not `docker compose down -v`.

### Database Selection

By default the backend uses SQLite (set via `DATABASE_PATH`). To switch to Postgres:
1. Set `DATABASE_URL=postgres://nexus:<password>@postgres:5432/nexus` in `.env`
2. Ensure `POSTGRES_PASSWORD` is set
3. Backend must be updated to support Postgres — see THE-375 backend subtask

### Stopping

```bash
docker compose down          # stop containers (preserves volumes)
docker compose down -v       # stop and remove volumes (destroys all data!)
```
