# Nexus Engineering — Demo Project

**Last Updated:** 2026-07-24

---

This directory contains a pre-built demo project that showcases Nexus Engineering capabilities. The demo represents a fictional **"Bike App"** platform with full traceability across the engineering lifecycle.

## Contents

| Directory | Format | Count | Description |
|-----------|--------|-------|-------------|
| `requirements/` | `.req.yaml` | 3 docs, 10 reqs | Auth, org management, audit log requirements |
| `architecture/` | `.arch.yaml` | 3 ADRs | Auth strategy, org isolation, audit design |
| `features/` | `.feature.yaml` | 1 doc, 3 features | SSO login, org admin, audit viewer |
| `results/` | `.ter.yaml` | 1 doc, 12 executions | Test results across 4 test suites |
| `demo-trace-links.yaml` | `.yaml` | 31 trace links | Full cross-document traceability |

## Coverage Matrix

| Artifact | Type | Count |
|----------|------|-------|
| Requirements | functional, non-functional | 10 |
| ADRs | architecture decision records | 3 |
| Features | feature documents | 3 |
| Test executions | passed, flaky | 12 |
| Trace links | satisfies, verifies, dependsOn | 31 |

## Domains Covered

- **Authentication** — email/password, OAuth (Google/GitHub), SAML v2, JWT session management
- **Organization Management** — org CRUD, member management, cross-org data isolation
- **Audit Log** — event capture, query/export, retention policies
- **Traceability** — full trace chain from requirements → ADRs → features → test results

## Demo Script

For a complete walkthrough guide, see [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

The demo script includes:
- 15-20 minute guided tour of all features
- Key talking points for each section
- Troubleshooting tips
- Value proposition summary

## Import

To load this demo data into the Nexus system:

```bash
node scripts/import-demo.cjs
```

Or scan the demo directory via the API:

```bash
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"repositoryPath": "./docs/demo"}'
```

## Verifying the Demo

1. Start the application: `pnpm dev`
2. Open http://localhost:5173
3. Create an account or log in
4. Navigate to the **Scanner** and scan `docs/demo`
5. Explore artifacts in the **Artifact Registry**
6. View trace links in the **Graph Builder**

Expected: **10 requirements, 3 ADRs, 3 features, 12 test executions, 31 trace links** discovered.
