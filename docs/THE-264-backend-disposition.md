# THE-264 — Session Rotation / 65536 Overflow: Backend Implementation

**Owner:** BackendArchitect
**Implements:** THE-256 (R1-Fix Session Rotation, 65536-token context-window overflow)
**Status:** Implementation complete — pending verification in next sprint sample.
**Date:** 2026-07-20

---

## 1. Root cause (why `adapter_failed (> 65536 tok)` loops)

The Paperclip agent runtime (`paperclip-platform` repo) already has session-rotation
machinery in `server/src/services/heartbeat.ts::evaluateSessionCompaction`, gated by
`CONTEXT_WINDOW_TOKEN_BUDGET = Math.round(0.85 * 65536)` (55658) in
`packages/adapter-utils/src/session-compaction.ts`. Two defects prevented it from ever
firing for the overflowing adapters:

1. **Suppressed healing rotation** — `evaluateSessionCompaction` returned `rotate: false`
   whenever the latest run errored with `adapter_failed` (in a `TRANSIENT_INFRA_ERROR_CODES`
   guard). A context overflow is *exactly* the case rotation is meant to fix, so the
   bloated session never got a fresh window and the next run overflowed again → permanent
   `adapter_failed` loop.
2. **Disabled thresholds for confirmed-local adapters** — adapters reporting
   `nativeContextManagement: "confirmed"` (claude_local, codex_local, acpx_local,
   hermes_local) were given `ADAPTER_MANAGED_SESSION_POLICY` with **all thresholds = 0**,
   so `hasSessionCompactionThresholds` was false and rotation was fully skipped — even
   though those local CLI adapters wrap a fixed ~64k window and DO overflow it.

The durable-progress flush (handoff markdown to `.paperclip/context/session-rotation-*.md`)
and the compact-session-summary already existed (heartbeat.ts ~L8898); only the trigger
was broken.

## 2. Fix

**`packages/adapter-utils/src/session-compaction.ts`**
- `ADAPTER_MANAGED_SESSION_POLICY.maxRawInputTokens` → `CONTEXT_WINDOW_TOKEN_BUDGET`
  (55658), so confirmed-local adapters now rotate at the 0.85×65536 budget instead of
  never.
- Added + exported `isContextOverflowError(error)` to detect the overflow failure
  signature (`exceeds the available context size`, `context size (N tokens)`,
  `> N tok`, `context window`).

**`server/src/services/heartbeat.ts::evaluateSessionCompaction`**
- Renamed the guard set to `NON_OVERFLOW_TRANSIENT_ERROR_CODES` (`timeout`,
  `process_lost`) so `adapter_failed` is no longer blanket-suppressed.
- Added a forced rotation reason when the latest run failed with an overflow-class
  `adapter_failed`, even if token accounting didn't surface a budget reason.
- Rotation now triggers on: per-run input ≥ threshold, cumulative input ≥ 0.85×65536,
  session age, OR a context-overflow `adapter_failed`.

## 3. Verification

- `packages/adapter-utils/src/session-compaction.test.ts` added (6 tests, passing):
  confirmed-local adapters now enable the token threshold; `isContextOverflowError`
  matches THE-253 phrasing and rejects non-overflow errors.
- `server` `tsc --noEmit` clean for the changed files.

## 4. Acceptance-criteria coverage (THE-264)

- [x] Token budgeting at 0.85 × 65536 threshold — `CONTEXT_WINDOW_TOKEN_BUDGET`, now active for all overflowing adapters.
- [x] Rotation trigger emits compact session summary — unchanged, already emitted via `handoffMarkdown`.
- [x] Durable-progress flush to `.paperclip/context/*.md` — unchanged, already implemented.
- [x] Do-not-rotate conditions honored — `timeout`/`process_lost` still suppress; mid-tool writes are handled by the existing run-commit boundary.
- [ ] Zero `adapter_failed` context-overflow runs in next sprint sample — **pending live verification**.

## 5. Cross-references

- `reports/THE-256-session-rotation-spec.md`, `docs/THE-256-cto-disposition.md`
- `reports/failure-classification.md` (THE-253) — R1 context-overflow failure mode.
- Code: `server/src/services/heartbeat.ts`, `packages/adapter-utils/src/session-compaction.ts`.
