# Run Local — Nexus Engineering

Single-command local setup for developers, QA, and reviewers.

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+ (`npm install -g pnpm@9`)
- Docker (optional — for Postgres; backend defaults to SQLite otherwise)

## Quick Start

```bash
# 1. Check out a release or develop branch
git checkout develop
git pull origin develop

# 2. Run everything
./scripts/run-local.sh
```

This starts the backend (port 3001) + frontend (port 5173) in parallel.
Postgres starts via Docker if available; otherwise the backend uses SQLite.

## Variants

```bash
# Skip Postgres entirely (use SQLite)
./scripts/run-local.sh --no-db

# Force pnpm install before starting
./scripts/run-local.sh --build
```

## Verify

```bash
# Backend health
curl http://localhost:3001/health
# → {"status":"ok"}

# Frontend (open in browser)
open http://localhost:5173
```

## Manual Startup

If you prefer running services individually:

```bash
# Terminal 1: Backend
pnpm --filter @nexus-engineering/backend dev

# Terminal 2: Frontend
pnpm --filter @nexus-engineering/frontend dev
```

## Docker Compose (Production-like)

```bash
docker compose up --build
# Backend → http://localhost:3001
# (Frontend is built and served by the backend)
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pnpm: command not found` | Install pnpm: `npm install -g pnpm@9` |
| Backend fails to start | Ensure `.env` exists: `cp .env.example .env` |
| Port 3001 in use | Set `PORT=3002` in `.env` |
| Port 5173 in use | Vite auto-picks next available port |
