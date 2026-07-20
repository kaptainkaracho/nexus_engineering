# Nexus Engineering — Setup Guide

**Version:** 1.0
**Last Updated:** 2026-07-19

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running](#running)
5. [Deployment](#deployment)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ (LTS recommended) | Runtime |
| pnpm | 9+ | Package manager |
| Git | Any | Version control |

### Install pnpm

```bash
npm install -g pnpm
# or
corepack enable && corepack prepare pnpm@latest --activate
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nexus-engineering
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies across the monorepo (apps, packages, shared libraries).

### 3. Verify Setup

```bash
pnpm typecheck && pnpm lint
```

---

## Configuration

### Environment Variables

Copy the example environment file and customize:

```bash
cp .env.example apps/backend/.env
```

#### Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `HOST` | `0.0.0.0` | Backend server host |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_PATH` | `:memory:` | SQLite database path (file path for persistence) |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated) |

#### Auth Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `dev-secret...` | JWT signing secret (change in production) |
| `OAUTH_CALLBACK_URL` | `http://localhost:3001` | OAuth callback base URL |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth client secret |

#### Audit Log Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUDIT_LOG_TTL_DAYS` | `90` | Days to retain audit logs |
| `AUDIT_LOG_AUTO_PURGE` | `true` | Enable automatic purge of old logs |

---

## Running

### Development Mode

Start both backend and frontend with hot-reload:

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

### Run Backend Only

```bash
cd apps/backend && npx tsx src/index.ts
```

### Run Frontend Only

```bash
cd apps/frontend && npx vite
```

### Import Demo Data

```bash
node scripts/import-demo.js
```

---

## Testing

```bash
# All tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Specific test file
pnpm test -- apps/backend/src/routes/auth.test.ts
```

---

## Deployment

### Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Link project**:
   ```bash
   railway init
   ```

4. **Set environment variables** via Railway dashboard or CLI:
   ```bash
   railway variables set JWT_SECRET=<production-secret>
   railway variables set NODE_ENV=production
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

### GitHub Actions

The repository includes CI/CD workflows in `.github/workflows/`:

- `ci.yml` — Runs on PR and push to main: lint, typecheck, test, build
- `deploy.yml` — Deploys to Railway on push to main

### Manual Production Build

```bash
pnpm build
NODE_ENV=production node apps/backend/dist/index.js
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3001 in use | `lsof -i :3001` then `kill -9 <PID>` |
| Missing dependencies | `rm -rf node_modules && pnpm install` |
| TypeScript errors | `rm -rf apps/*/dist packages/*/dist && pnpm typecheck` |
| Database issues | Reset by deleting DB file or switching `DATABASE_PATH` |
| OAuth not working | Verify `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` and callback URLs |
