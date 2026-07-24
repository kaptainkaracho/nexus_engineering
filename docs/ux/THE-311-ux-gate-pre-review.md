# THE-311 UX Gate: Trace Gate Config Panel — Pre-Review Findings

**Date:** 2026-07-20
**Reviewer:** UXDesigner
**Status:** ⏸ BLOCKED — No implementation to review

---

## Dependency Chain

Per `plans/sprint-19-plan.md`:

- **Wave 1:** THE-308 (BackendArchitect) + THE-309 (FrontendArchitect) — both `in_progress`
- **Wave 2:** THE-310 (BackendArchitect) + THE-311 (UXDesigner) — promoted **after** Wave 1 completes

THE-311 is gated on THE-309 (Trace Gate Config UI). The plan explicitly states:
> "promote Wave 2 (THE-310 + THE-311) when Wave 1 done" (line 169)

## Evidence: THE-309 Has Not Been Implemented

| Check | Result |
|-------|--------|
| `apps/frontend/src/components/trace-gate/GateConfigPanel.tsx` | ❌ Does not exist |
| `apps/frontend/src/components/trace-gate/GateStatusBadge.tsx` | ❌ Does not exist |
| `apps/frontend/src/components/trace-gate/` directory | ❌ Does not exist |
| `apps/frontend/src/api/traceGate.ts` | ❌ Does not exist |
| `packages/shared/src/results/index.ts` — `TraceGateConfig` export | ❌ Not exported |
| Any route for gate config in `App.tsx` | ❌ Not registered |
| Any nav entry for gate config | ❌ Not found |

## What Was Verified

- Full file-system scan for trace-gate, TraceGate, traceGate patterns across all of `apps/frontend/`
- Check for `gate`-related routes in `App.tsx`
- Check for gate-related types in `packages/shared/src/results/`
- Confirmed the Sprint 19 plan is still in "Awaiting CEO Approval" state (Board Approval: Pending)
- Wave 1 (THE-308, THE-309) is still `in_progress`

## Design Lenses Applied to Plan Spec (Proactive Pre-Review)

While I cannot review an implementation that doesn't exist, the following usability risks are already visible from the plan spec. These should be addressed in THE-309 implementation:

### 1. Hick's Law / Choice Overload — Config Form
The plan specifies 4 config inputs (coverageThreshold, maxGaps, requireTypes, mode). This is manageable but `requireTypes` as a multi-select with unknown options could balloon. **Recommendation:** Limit to 5-7 common types with a search/filter. Group advanced options under an "Advanced" disclosure if more are needed.

### 2. Norman's Mapping / Feedback — "Test Gate" Button
The plan says "Test gate button → shows TraceGateResult (pass badge + violations list)". The mapping from "Test" to result must be immediate and unambiguous. **Recommendation:** Position the result inline below the button (not a toast/modal). Show pass/fail with a clear icon + color. List violations in plain language with severity indicators.

### 3. Recognition over Recall — Mode Selector
`block` vs `warn` mode names are system-oriented, not user-oriented. A new user won't know what these mean without help text. **Recommendation:** Add tooltip or inline help: "Warn: notify but don't block CI" / "Block: fail CI when gate doesn't pass". Consider icon pair (shield with exclamation / shield with check).

### 4. Cognitive Load / Progressive Disclosure — Default Config
The plan mentions "empty (default config)" state. Default config values (e.g., coverageThreshold=80, maxGaps=0, mode=warn) should be shown in the form fields, not hidden. User should see what the current policy is immediately.

### 5. Loss Aversion / Commitment & Consistency — Mode Switch Warn→Block
Switching from `warn` to `block` mode risks breaking CI if thresholds aren't met. **Recommendation:** When switching to `block` mode, show an inline warning: "Block mode will fail CI when thresholds aren't met. Test your current config first." This is a confirmation step that respects the principle of forgiveness.

### 6. Error Prevention — PUT Config Validation
Config MUST be validated before saving. **Recommendation:** Inline validation on all fields. `coverageThreshold` range 0-100, `maxGaps` ≥ 0 integer, `requireTypes` at least one valid type, `mode` one of `warn`|`block`. Show error inline, not in a modal.

### 7. Visual Hierarchy — Violations List
Violations should be scannable. **Recommendation:** Each violation gets: icon (❌), metric name ("Coverage"), current value ("72%"), threshold ("≥ 80%"). Use the existing design system's alert/notification component if available.

## Next Action

THE-311 cannot proceed until THE-309 delivers a reviewable implementation.

**Unblock owner:** CTO (or FrontendArchitect when THE-309 is ready for review)
**Required deliverable:** GateConfigPanel + GateStatusBadge components rendered in a runnable dev server or Storybook, with all states (loading, empty/default, configured, error, test result).
