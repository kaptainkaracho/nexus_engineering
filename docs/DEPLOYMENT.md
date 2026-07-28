# Nexus Engineering — Deployment Guide

**Version:** 1.1  
**Last Updated:** 2026-07-28  
**Changelog:** Added Railway one-click deploy flow for GTM (THE-405)

---

## Table of Contents

1. [Overview](#overview)
2. [One-Click Deploy](#one-click-deploy)
3. [Prerequisites](#prerequisites)
4. [Environment Variables](#environment-variables)
5. [Railway Deployment](#railway-deployment)
6. [GitHub Actions CI/CD](#github-actions-cicd)
7. [Preview Environments](#preview-environments)
8. [Production Deployment](#production-deployment)
9. [Monitoring & Scaling](#monitoring--scaling)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Nexus Engineering deploys to [Railway](https://railway.app/) using GitHub Actions for continuous integration and deployment.

### Architecture

```
GitHub Repository
       ↓
GitHub Actions (CI/CD)
       ↓
Railway (Hosting)
├── Frontend Service (React)
└── Backend Service (Fastify)
```

### Deployment Flow

1. **Pull Request** → Runs tests, lint, typecheck
2. **PR Merge to main** → Deploys to Railway production
3. **Manual Trigger** → Deploy to preview or production

---

## One-Click Deploy

Deploy Nexus Engineering to Railway with a single click — no CLI setup required.

### Deploy to Railway

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?templateRepo=https://github.com/TheBikeApp/Nexus)

Click the button above to start a new Railway deployment from the Nexus repository. Railway will:

1. Detect the `railway.toml` configuration
2. Install Node.js 20 and pnpm 9
3. Build the frontend via `pnpm --filter @nexus-engineering/frontend build`
4. Start the backend with `pnpm --filter @nexus-engineering/backend start`
5. Configure health checks at `/health`

### What You Get

| Resource | Default |
|----------|---------|
| Frontend URL | `https://your-project.up.railway.app` |
| Backend API | Same origin (`:3001` → proxy) |
| Health Check | `/health` on the backend service |
| Database | SQLite at `/data/nexus.db` (persistent volume) |
| Build | Nixpacks auto-detection + `pnpm build` |

### Configure After Deploy

After deployment, set your environment variables in the Railway dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_PATH` | Yes | Set to `/data/nexus.db` |
| `JWT_SECRET` | Yes | A strong secret for JWT signing |
| `CORS_ORIGIN` | No | Allowed origins (defaults to `*`) |
| `LOG_LEVEL` | No | Logging level (defaults to `info`) |

### Deploy via CLI

If you prefer the command line:

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login and link your project
railway login
railway init

# Deploy
railway up
```

### Self-Hosting Alternatives

If Railway is not available, Nexus can be deployed to any Docker-compatible platform:

```bash
docker compose up -d
```

See the `docker-compose.yml` in the repository root for the full configuration.

Before deploying, ensure you have:

- **Railway Account** — Sign up at [railway.app](https://railway.app/)
- **GitHub Repository** — Access to the Nexus repository
- **Railway Token** — API token for authentication
- **Node.js 20+** — For local testing

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `RAILWAY_TOKEN` | Railway API token | `xxxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed origins | `*` |
| `DATABASE_URL` | SQLite database path | `./data/nexus.db` |

### Setting Environment Variables

#### Railway Dashboard

1. Go to your Railway project
2. Click on the service
3. Navigate to **Variables** tab
4. Add or edit variables

#### Railway CLI

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

---

## Railway Deployment

### Initial Setup

1. **Install Railway CLI**:
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   railway init
   ```

4. **Add Services**:
   ```bash
   # Add backend service
   railway service create backend
   
   # Add frontend service
   railway service create frontend
   ```

### Manual Deployment

```bash
# Deploy backend
railway up --service backend

# Deploy frontend
railway up --service frontend

# Deploy to specific environment
railway up --service backend --environment preview
```

### Linking GitHub Repository

1. Go to Railway project settings
2. Navigate to **Source**
3. Connect your GitHub repository
4. Select the branch (usually `main`)
5. Configure build settings if needed

---

## GitHub Actions CI/CD

### Workflow Overview

The project uses two GitHub Actions workflows:

#### 1. CI Workflow (ci.yml)

Triggers on:
- Pull requests
- Push to `main`

Steps:
- Install dependencies
- Run linting
- Run type checking
- Run tests
- Build application

#### 2. Deploy Workflow (deploy.yml)

Triggers on:
- Push to `main`
- Manual dispatch

Steps:
- Build application
- Deploy to Railway

### Workflow Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: railway up --service backend
```

### Required Secrets

Add these secrets in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token |

---

## Preview Environments

Preview environments allow testing changes before production.

### Automatic Preview Deploys

When a pull request is created:
1. GitHub Actions runs CI checks
2. If successful, deploys to Railway preview environment
3. Posts preview URL on the PR

### Manual Preview Deploy

```bash
# Deploy to preview
railway up --service backend --environment preview
railway up --service frontend --environment preview
```

### Preview Environment Features

- Isolated from production
- Unique URL for testing
- Automatic cleanup on PR close

---

## Production Deployment

### Deployment Process

1. **Merge to main** — Triggers production deploy
2. **Build** — Compiles application
3. **Deploy** — Updates Railway services
4. **Verify** — Health checks pass

### Manual Production Deploy

```bash
# Deploy to production
railway up --service backend --environment production
railway up --service frontend --environment production
```

### Rollback

If issues arise:

```bash
# List recent deployments
railway logs --service backend

# Rollback to previous version
railway rollback --service backend
```

---

## Monitoring & Scaling

### Health Checks

The backend exposes a health endpoint:

```bash
curl http://localhost:3000/api/health
```

### Logs

```bash
# View logs
railway logs --service backend

# Follow logs
railway logs --service backend --follow
```

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Request latency
- Error rates

### Scaling

#### Manual Scaling

```bash
# Scale to 2 instances
railway scale --service backend --instances 2
```

#### Auto-scaling

Configure in Railway dashboard:
1. Go to service settings
2. Enable auto-scaling
3. Set min/max instances
4. Configure scaling triggers

---

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs
railway logs --service backend

# Common causes:
# - Missing dependencies
# - TypeScript errors
# - Build script failures
```

#### Deployment Failures

```bash
# Check deployment status
railway status

# Common causes:
# - Invalid environment variables
# - Port conflicts
# - Health check failures
```

#### Application Errors

```bash
# View application logs
railway logs --service backend --follow

# Check for:
# - Runtime errors
# - Memory issues
# - Database connection problems
```

### Debugging

#### Local Testing

Test production build locally:

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

#### Environment Variables

Verify environment variables are set:

```bash
railway variables --service backend
```

#### Database Issues

If using SQLite:

```bash
# Check database file
railway shell --service backend
ls -la ./data/
```

### Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app/)
- **GitHub Issues**: Open an issue in the repository
- **Community**: Railway Discord server

---

## Security Considerations

### Secrets Management

- Never commit secrets to git
- Use Railway's secret management
- Rotate tokens regularly
- Use least-privilege access

### Network Security

- Enable HTTPS in production
- Configure CORS properly
- Use rate limiting
- Monitor for abuse

### Data Protection

- Encrypt sensitive data
- Regular backups
- Access logging
- Compliance with regulations

---

**Last updated:** 2026-07-28 | THE-405
