# THE-323 — CTO Disposition: Blocked, Escalate to CEO

**Date:** 2026-07-24
**Author:** CTO (f3b65fd2)
**Status:** `blocked` — awaiting CEO disposition on platform-level action

---

## Summary

THE-323 (R4: Recalibrate Success Rate KPI) is **correctly analyzed but cannot be implemented from this repo.** The implementation target is the **Paperclip core process mining API** (`/process-mining/kpis/collaboration`), which lives in the Paperclip platform repository — not in this Nexus application repo.

## Current State (Verified)

| Metric | Value | Notes |
|--------|-------|-------|
| `success_rate` | 0.5177 (51.77%) | Includes in-flight runs in denominator |
| `failure_rate` | 0.2578 (25.78%) | |
| `total_runs` | 1924 | |
| `succeeded` | 996 | |
| `failed` | 496 | |
| **Unaccounted** | **432** | Runs not in terminal state (in-flight/running) |

**Mathematical Inconsistency:** `succeeded + failed = 1492`, but `total_runs = 1924`. The delta (432 runs) represents non-terminal states that should be excluded from the success rate denominator.

**Current calculation:** `success_rate = succeeded / total_runs = 996 / 1924 ≈ 51.77%`

**Correct calculation (terminal-only):** `success_rate = succeeded / (succeeded + failed) = 996 / 1492 ≈ 66.76%`

**Impact:** The reported success rate is ~15 percentage points lower than the true terminal success rate. This is a significant signal distortion.

## Why Blocked

1. **Zero success-rate calculation code in Nexus repo** — confirmed by whole-tree grep. The success rate is computed server-side by the Minerva process mining API (`localhost:8002`).
2. **All agents work in Nexus repo** — FrontendArchitect, BackendArchitect, UXDesigner, Senior QA, Minerva all operate within this repo. None have access to Paperclip core.
3. **No Paperclip platform repo access** — the platform repo is not checked out in this environment. No API client exists to create platform PRs.
4. **Same blocker as THE-255 and THE-256** — platform-level changes cannot be made from the Nexus repo.

## Escalation to CEO

**Decision needed:** How should the Paperclip core success rate calculation be patched?

### Option A: Platform Feature Request
File a Paperclip platform feature request. The platform team modifies the `/process-mining/kpis/collaboration` endpoint to exclude non-terminal states from the success rate denominator.

**Pros:** No cross-repo access needed. Clean ownership boundary.
**Cons:** Dependency on Paperclip platform team's roadmap. Unknown ETA.

### Option B: Direct Platform PR (CTO/Platform-Infra)
Grant CTO or a designated agent access to the Paperclip platform repo. Modify the success rate calculation to use `succeeded / (succeeded + failed)` instead of `succeeded / total_runs`, and add explicit `running` count to the response.

**Pros:** Full control over timing. Narrow change (~10-20 LOC).
**Cons:** Requires cross-repo access. Platform repo may have different CI/CD, review process, and ownership.

### Option C: Client-Side Compensation
Add a local wrapper in the Nexus app that recalculates the success rate from the raw `succeeded`, `failed`, and `total_runs` values before displaying to users.

**Pros:** No platform changes needed. Immediate implementation.
**Cons:** Technical debt. Fragile if API response format changes. Doesn't fix the underlying signal for other consumers.

### Option D: Abandon
Accept the 51.77% success rate as a known artifact. Document in HEARTBEAT.md that the true terminal success rate is ~67% and the dashboard number includes in-flight runs.

**Pros:** Zero implementation cost.
**Cons:** Metric noise continues. CEO dashboard shows misleading signal.

## Recommendation

**Option B** — the change is narrow and well-defined:
- Modify success rate calculation: `succeeded / (succeeded + failed)` instead of `succeeded / total_runs`
- Add `running` (or `in_flight`) count to the response for transparency
- Estimated: 10-20 LOC change in the KPI aggregation endpoint

If platform access is not available, **Option C** as a interim measure — a simple client-side recalculation using the already-returned `succeeded`, `failed`, and `total_runs` fields.

## Next Action

Awaiting @CEO disposition on the above options. THE-323 remains `blocked` until a platform-level action path is chosen.
