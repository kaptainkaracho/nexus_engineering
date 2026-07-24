# Trace Gate — Runbook

The Trace Gate enforces traceability health as an engineering norm. A gate
evaluates the live trace graph against a policy and produces a `pass | fail`
verdict. In `warn` mode (default) a failing verdict only annotates; in `block`
mode it fails the CI job.

## Components

| Piece | Location | Owner |
|-------|----------|-------|
| Gate engine + API | `apps/backend/src/services/traceGateStore.ts`, `apps/backend/src/routes/traceability.ts` (`/api/traceability/gate`, `/api/traceability/gate-config`) | Backend |
| Shared engine | `packages/shared/src/results/traceGate.ts` (`evaluateGate`, `normalizeGateConfig`) | Backend |
| CI CLI | `scripts/trace-gate.mjs` | Backend |
| Reusable action | `.github/actions/trace-gate/action.yml` | Backend |
| CI job | `trace-gate` job in `.github/workflows/ci.yml` | Backend |

## Policy

| Field | Meaning | Default |
|-------|---------|---------|
| `coverageThreshold` | Overall coverage % must be ≥ this (0–100) | `80` |
| `maxGaps` | Max cross-artifact type-pair gaps allowed | `0` |
| `requireTypes` | Artifact types that must exist in the graph | `['requirement','feature','testCase']` |
| `mode` | `block` fails CI; `warn` annotates only | `warn` |

## Enable block mode (fail merges)

Set repo **Variables** (not secrets):

- `TRACE_GATE_MODE = block`
- `TRACE_GATE_API_URL = <preview env URL>` (a running backend the job can reach)

The `trace-gate` job reads these via `vars.TRACE_GATE_API_URL` and
`env.TRACE_GATE_MODE`. It is `continue-on-error: true` and `warn`-only by
default, so it **never breaks existing pipelines** until you opt in.

To disable the job entirely set `TRACE_GATE_ENABLED = false`.

## CLI usage

```bash
# Warn mode (default, never fails)
node scripts/trace-gate.mjs --api-url http://localhost:3000

# Force non-blocking regardless of server verdict
node scripts/trace-gate.mjs --api-url http://localhost:3000 --warn-only

# Override policy inline
node scripts/trace-gate.mjs --coverage-threshold 90 --max-gaps 0 --mode block

# Offline policy override file (.nexus/trace-gate.json)
node scripts/trace-gate.mjs --config .nexus/trace-gate.json
```

Exit codes: `0` = pass, or fail in `warn`/`--warn-only` mode; `1` = fail in
`block` mode. Network/API failures are **fail-safe** (exit `0` with a warning).

## Tuning thresholds

1. Read current config: `GET /api/traceability/gate-config`
2. Update: `PUT /api/traceability/gate-config` with the new policy.
3. Or edit `.nexus/trace-gate.json` and pass `--config` to the CLI.
4. Re-run the gate; iterate on `coverageThreshold`/`maxGaps` until the graph
   meets the bar, then switch `TRACE_GATE_MODE` to `block`.

## Verifying a CI run

- The `trace-gate` job appears under every push/PR once `TRACE_GATE_ENABLED`
  is not `false`.
- In `warn` mode a failing verdict shows `gate FAILED but mode=warn —
  annotating only (non-blocking)` and the job stays green.
- In `block` mode a failing verdict shows `gate FAILED in block mode —
  failing CI job.` and fails the job.
