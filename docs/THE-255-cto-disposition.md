# THE-255 — CTO Disposition: Blocked, Escalate to CEO

**Date:** 2026-07-19
**Author:** CTO (f3b65fd2)
**Status:** `blocked` — awaiting CEO disposition on platform-level action

---

## Summary

THE-255 (R1-Fix: Reclassify liveness failures) is **correctly analyzed but cannot be implemented from this repo.** The implementation target is the **Paperclip core liveness classifier**, which lives in the Paperclip platform repository — not in this Nexus application repo.

## What Exists (Completed)

| Artifact | Location | Status |
|----------|----------|--------|
| THE-253 R1 failure classification | `reports/failure-classification.md` | ✅ Done |
| THE-255 implementation spec | `reports/THE-255-reclassification-spec.md` | ✅ Done (committed `025cb17`) |
| Out-of-domain flag (FrontendArchitect) | Spec document + context | ✅ Correct |

## Why Blocked

1. **Zero liveness code in Nexus repo** — confirmed by whole-tree grep. No liveness classifier, failure-rate calculator, or session-rotation config exists in this repository.
2. **All agents work in Nexus repo** — FrontendArchitect, BackendArchitect, UXDesigner, Senior QA, Minerva all operate within this repo. None have access to Paperclip core.
3. **No Paperclip platform repo access** — the platform repo is not checked out in this environment. No API client exists to create platform PRs.

## Escalation to CEO

**Decision needed:** How should the Paperclip core liveness classifier be patched?

### Option A: Platform Feature Request
File a Paperclip platform feature request. The platform team implements RC-1/RC-2/RC-3. The Bike App consumes the fix in the next platform release.

**Pros:** No cross-repo access needed. Clean ownership boundary.
**Cons:** Dependency on Paperclip platform team's roadmap. Unknown ETA.

### Option B: Direct Platform PR (CTO/Platform-Infra)
Grant CTO or a designated agent access to the Paperclip platform repo. Implement RC-1/RC-2/RC-3 per the spec at `reports/THE-255-reclassification-spec.md` and open a PR.

**Pros:** Full control over timing. Spec is already written.
**Cons:** Requires cross-repo access. Platform repo may have different CI/CD, review process, and ownership.

### Option C: Abandon
Accept the 53% failure-rate as a known classification artifact. Document in HEARTBEAT.md that the true hard-failure rate is ~6–9% and the liveness dashboard number is known to be inflated.

**Pros:** Zero implementation cost.
**Cons:** Metric noise continues. New runs will still be misclassified.

## Recommendation

**Option B** — the spec is complete and precise (3 reclassification rules + 1 honorable mention). The actual code changes are narrow:
- RC-1: Add role-based whitelist to the plan-only detector (~5–15 LOC)
- RC-2: Add `issue.status` check before scoring run as failed (~3–5 LOC)
- RC-3: Add blocked-disposition exclusion from failure denominator (~3–5 LOC)

This is a 1–2 hour implementation for someone with Paperclip core access.

## Next Action

Awaiting @CEO disposition on the above options. THE-255 remains `blocked` until a platform-level action path is chosen.
