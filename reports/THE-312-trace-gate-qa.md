## QA Befund — THE-312 Trace Gate Verification & e2e

**Status:** QA: PASS
**Datum:** 2026-07-20
**Agent:** Senior QA Automation Engineer (ca0371b3)

---

### Summary

Created 14 Playwright E2E tests for the Trace Gate Configuration panel
(`apps/frontend/e2e/trace-gate.spec.ts`) plus gate API mock infrastructure in the
shared E2E fixture (`apps/frontend/e2e/fixtures.ts`).

### Changes

| File | Type | Description |
|------|------|-------------|
| `apps/frontend/e2e/fixtures.ts` | Modified | Added gate types (`GateMode`, `TraceGateConfigData`, `GateViolationData`, `GateMetricsData`, `TraceGateResultData`), ApiController handlers (`gateConfig`, `gateConfigError`, `gateResult`, `gateResultError`), helper builders (`makeGateConfig`, `makeGateResult`, `makeGateViolation`), and changed unhandled dispatch from 404 to `route.fallback()` for proper route chaining |
| `apps/frontend/e2e/trace-gate.spec.ts` | New | 14 hermetic E2E tests mocking the backend at the network level |

### Test Coverage

| Test | Verifies |
|------|----------|
| loads and displays the gate configuration panel | Full component renders with all form fields and buttons |
| displays the default config in the form fields on load | Coverage threshold and max gaps spinbuttons show stored values |
| shows error when saving configuration fails | Alert with HTTP 500 shown on PUT failure |
| shows a passing gate result with no violations | PASS badge + "No violations" message |
| shows violations when gate fails due to low coverage | FAIL badge + violation message + count |
| shows violations when gate fails due to excessive gaps | FAIL badge + gap-specific violation message |
| shows violations for missing required types | FAIL badge + missing-types violation message |
| warn mode badge shows FAIL (warn) on gate failure | Badge reads "FAIL (warn)" for warn mode |
| block mode badge shows FAIL on gate failure | Badge reads "FAIL" for block mode |
| block mode shows warning alert in the mode section | Alert shown: "Block mode will fail CI" |
| reset button restores original saved config | Changed fields revert to saved values on Reset |
| shows error state when gate config fetch fails | Alert with HTTP 500 shown on GET failure |
| shows error state when gate evaluation fails | Alert with HTTP 500 on Test Gate failure |
| no uncaught page errors during interaction | Zero page errors across all interactions |

### Results (chromium, firefox, Mobile Chrome)

```
  ✓ 42 passed (14 tests × 3 projects)
  ✗ 14 skipped (webkit only — missing system deps on host)
```

### Infrastructure Fix

The ApiController's `dispatch()` method was changed from returning a 404 default
to calling `route.fallback()`. This allows per-test `page.route()` handlers to
intercept specific paths (e.g. saving config via PUT) without conflicting with
the catch-all regex, while still providing sensible defaults for unhandled paths.

### Findings

- **Pre-existing:** All E2E tests require a mocked auth session in sessionStorage
  — the app redirects unauthenticated users to the LandingPage. Added
  `addInitScript` in beforeEach to set this up.
- **Pre-existing:** `Webkit` cannot launch on this host (missing system libs).
- **Pre-existing:** 3 TypeScript errors in `NLQueryResults.tsx` / `QueryHistory.tsx`
  (`style` prop not accepted by `StackProps`) — not related to trace-gate work.
- **Pre-existing:** Lint errors in 20+ files across the codebase — not related.

### Remaining (per Sprint 19 plan)

1. **CI dry-run** — Requires GH Actions environment. Execute `trace-gate` job on
   a feature branch; confirm non-blocking in warn mode and blocking in block mode.
   This can only be verified in CI, not locally.
2. **`docs/trace-gate.md` acceptance checks** — The runbook exists; verify CLI usage,
   CI setup, and threshold tuning sections match the implemented behavior.
