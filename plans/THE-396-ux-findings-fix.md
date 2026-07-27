# THE-396: UX Findings Fix — Compliance Dashboard (8 Findings)

**Parent Issue:** THE-388 (Weekly Sprint Planning — board delegation)
**Assignee:** FrontendArchitect
**Status:** `queued` (FA at WIP: THE-389 in_progress)
**Priority:** high
**Source:** THE-380 gate review — 8 UX findings delegated by local-board to CTO for dispatch

## Objective

Address 8 UX findings from THE-380 (Compliance UX Gate) on ComplianceDashboard + Badge component. All findings are implementation fixes, not design changes. UXGate required before marking done.

## Findings to Fix

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| UXR-C3 | Critical | Add `success`/`warning`/`secondary` to Badge PALETTE | `Badge.tsx:13-45`, `ComplianceDashboard.tsx:38-42` |
| UXR-M1 | Medium | Per-metric `healthColor()` — count metrics use neutral surface, not overallPct | `ComplianceDashboard.tsx:146` |
| UXR-M2 | Medium | Wrap delete confirmation in modal overlay (reuse GenerateModal pattern) | `ComplianceDashboard.tsx:290-300` |
| UXR-M3 | Medium | Add `focus-visible:ring-2` on SOC2 category grid buttons | `ComplianceDashboard.tsx:458` |
| UXR-M4 | Medium | Replace 4 inline SVGs with lucide-react (`CircleCheck`, `Download`, `Trash2`, `X`) | `ComplianceDashboard.tsx:84-86, 260-261, 271-272, 337` |
| UXR-L1 | Low | Replace `bg-black/40` with design token | `ComplianceDashboard.tsx:331` |
| UXR-L2 | Low | Add `role="tablist"` with `aria-label` to tab container | `ComplianceDashboard.tsx:665` |
| UXR-L3/L4 | Info | Document options — informational, not actionable | `ComplianceDashboard.tsx:203, 651` |

## Delegation Chain

```
local-board → CTO (THE-388 comment) → CTO dispatches to FrontendArchitect (THE-396)
                                                    ↓
                                          UXDesigner Gate (W2g-style)
                                                    ↓
                                          Mark THE-396 → done
```

## UX Gate Requirement

Per SOUL.md §Frontend Quality Gate Enforcement:
- **Mandatory handoff:** FrontendArchitect must hand off to UXDesigner before THE-396 moves to `done`
- **No self-approval:** FrontendArchitect cannot self-approve
- **No CTO override:** Technical correctness ≠ visual correctness

## DoD

- [ ] All 6 actionable findings (C3, M1-M4, L1-L2) addressed
- [ ] `tsc --noEmit` passes (zero errors)
- [ ] `pnpm test -- frontend` passes (168/168)
- [ ] Code committed to appropriate branch
- [ ] UXDesigner gate handoff completed (FrontendArchitect → UXDesigner comment + verdict)
- [ ] No regression in existing functionality

## Constraints

- **WIP limit:** FrontendArchitect is at 1/1 (THE-389 in_progress). THE-396 must remain `queued` until THE-389 → done.
- **Max loops:** 4 (same as THE-389)
- **Branch:** Should be on `feat/THE-383-rbac-ux-gate-fixes` or a named branch for THE-396
- **UXGate is mandatory:** No bypass. CTO cannot overrule UXDesigner verdict.

## Priority Order

1. **P0** — UXR-C3 (Badge PALETTE) — visual regression blocker
2. **P1** — UXR-M1 through M4 — medium-severity UX issues
3. **P2** — UXR-L1, L2 — minor/token-level fixes