# Quickstart

Get Nexus running in under 2 minutes.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Start

```bash
git clone https://github.com/TheBikeApp/Nexus.git && cd Nexus && pnpm install && pnpm dev
```

Open **http://localhost:5173** — you should see the Nexus landing page.

## Load demo data

```bash
node scripts/import-demo.cjs
```

This seeds the database with sample requirements, ADRs, features, test results, and 31 trace links representing a fictional "Bike App" project.

## What's next

| Goal | Path |
|------|------|
| Scan your own repo | Go to **Scanner** → enter a path → click **Scan** |
| See traceability | Go to **Graph View** → explore the demo trace links |
| Minimal traceability example | See [examples/simple-project](../examples/simple-project) |
| Full e-commerce traceability | See [examples/full-project](../examples/full-project) |
| Backend parser exercise | See [examples/tac-samples](../examples/tac-samples) |
| Deploy to Railway | See [Deployment Guide](DEPLOYMENT.md) |

## Quick reference

```bash
pnpm dev          # Start dev servers
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm test         # Run tests
```

---

**Last updated:** 2026-08-05 | THE-427
