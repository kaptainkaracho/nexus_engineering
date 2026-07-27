#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# run-local.sh
# Single command to build and run the full Nexus
# Engineering stack locally for development.
#
# Usage:
#   ./scripts/run-local.sh              # full stack
#   ./scripts/run-local.sh --no-db      # skip Postgres (use SQLite)
#   ./scripts/run-local.sh --build      # force rebuild
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-full}"

cd "$REPO_ROOT"

# 1. Set up .env if missing
if [ ! -f .env ]; then
  echo "=== Creating .env from .env.example ==="
  cp .env.example .env
  echo "  -> .env created. Review and adjust as needed."
fi

# 2. Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "=== Installing dependencies ==="
  pnpm install
fi

# 3. Start Postgres (optional)
if [ "$MODE" != "--no-db" ]; then
  echo "=== Starting Postgres via docker-compose ==="
  docker compose up -d nexus-postgres 2>/dev/null || echo "  (Postgres skipped — docker not available or service already running)"
else
  echo "=== Skipping Postgres (using SQLite) ==="
fi

# 4. Start dev servers
echo ""
echo "=== Starting development servers ==="
echo "  Backend  → http://localhost:3001"
echo "  Frontend → http://localhost:5173"
echo "  (Frontend proxies /api/* to backend automatically)"
echo ""
pnpm dev
