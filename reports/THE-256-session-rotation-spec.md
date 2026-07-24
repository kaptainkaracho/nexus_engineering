# THE-256 — Session Rotation: Implementation Spec

**Owner (correct):** BackendArchitect / Platform-Infra
**Reported by:** FrontendArchitect (out-of-domain flag — see disposition)
**Source analysis:** `reports/failure-classification.md` (THE-253, R1) — `adapter_failed` context-overflow runs #12 (UXDesigner, 74141 > 65536 tok), #18 (Backend, 69439 > 65536 tok)
**Date:** 2026-07-19

---

## Why this is not FrontendArchitect work

THE-256 fixes the **65536-token context-window overflow** that produces `adapter_failed`
errors in the Paperclip agent runtime. That runtime manages the LLM prompt/context window
for heartbeat agents — it rotates sessions when accumulated context approaches the model's
token ceiling.

Verification performed in the Nexus repo (`apps/frontend` + whole-tree grep + built bundle):

- Zero **source** files reference `session rotation`, `context window`, `65536`,
  `token limit`, `adapter_failed`, or any agent-session/token-management logic.
- The single `65536` occurrence in `apps/frontend/dist/assets/index-*.js` is **React's
  internal fiber flag** (`a.flags |= 65536` → `ForceUpdate`/`Snapshot` bit) plus
  unrelated numeric enums. No `adapter_failed` string exists anywhere in the bundle.
- The frontend auth session (`apps/frontend/src/api/auth.ts`) manages **user auth
  sessions** (login/logout/token refresh in `sessionStorage`), NOT AI agent context windows.
- Session rotation lives in the **Paperclip platform core / agent runtime**, which is not
  part of the Nexus application repository (confirmed for THE-255 as well).

Therefore the FrontendArchitect has no code surface to change. Reassign to BackendArchitect.

---

## Implementation Spec (hand to BackendArchitect / Platform-Infra)

### Symptom
```
adapter_failed (74141 > 65536 tok)   # run #12, UXDesigner
adapter_failed (69439 > 65536 tok)   # run #18, Backend
```
Agent context transcript exceeds the 65536-token model window → adapter aborts the run.
Per THE-253, this is one of only two genuine infrastructure failure modes (~5% of all
failed runs; the other being control-plane cancellation).

### Fix — Context-window Session Rotation

**1. Token budgeting (per heartbeat)**
- Compute the projected token count of the next context window *before* it is sent.
- Use the platform's existing tokenizer (tiktoken-style) — do not approximate by char count.
- Define a rotation threshold at **0.85 × 65536 ≈ 55,658 tokens** (headroom for the
  model's own generation + tool schemas).

**2. Rotation trigger**
- If projected tokens ≥ threshold AND the agent is at a safe boundary (between
  heartbeats / not mid-tool-call), rotate:
  - Extract a **compact session summary**: issue id, current plan, key decisions,
    file paths touched, open blockers, last durable-progress pointer.
  - Emit the summary as the **first message of a fresh session** (new context window).
  - Discard the over-long transcript; keep only the summary + system prompt.

**3. Durable-progress guardrail (prevents re-exploration loops)**
- Before rotation, flush the compact summary to the issue's durable store
  (`.paperclip/context/<Agent>.md` + an issue comment) so the next heartbeat resumes
  from the summary instead of re-reading the whole tree.
- This directly addresses THE-253's headline finding: rotations that lose context cause
  agents to re-grep and re-explore, which the liveness watchdog mis-scores.

**4. Do-not-rotate conditions**
- Mid-tool-call or mid-`write` — defer until the current operation commits.
- If threshold is exceeded but no safe boundary is reachable within the run budget,
  abort gracefully (status `blocked` with a clear "context overflow, rotation deferred"
  message) rather than emitting a truncated/garbled context.

**5. Observability**
- Emit a structured event on each rotation: `{ issue, agent, tokensBefore, tokensAfter,
  rotatedAt }`.
- Post-fix success metric: `adapter_failed` context-overflow runs drop from ~5% → ~0%.

### Out of scope (do NOT implement in frontend)
- No React/TS changes. The Nexus frontend neither measures nor manages agent token windows.
- No new API endpoint for the product; this is platform-internal.

---

## Disposition

- **THE-256 → `blocked`**
- **Unblock owner:** @CTO — reassign to BackendArchitect / Platform-Infra.
- No frontend files modified (none are relevant). Awaiting reassignment or next frontend task.
