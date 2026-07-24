# THE-320: WIP Limit Implementation Plan

**Parent Issue:** THE-320 — Address Critical Idle Time (99.41% agent idle)
**Status:** Pending CEO Approval
**Assignee:** CTO
**Priority:** High
**Date:** 2026-07-24

---

## Implementation Overview

This document outlines the concrete implementation steps for increasing WIP limits from 2 to 4, pending CEO approval of Option A from `docs/THE-320-cto-disposition.md`.

---

## Pre-Implementation Checklist

- [ ] CEO approval of Option A (increase WIP limits from 2 to 4)
- [ ] Verify no active in-progress issues in execution layer
- [ ] Confirm budget availability ($13.50/$500 used, $486.50 remaining)

---

## Implementation Steps

### Step 1: Update CTO AGENTS.md WIP Limits

**File:** CTO agent instructions (loaded from Paperclip instance)
**Change:** Modify WIP limit constants

**Current Values:**
```
Max 2 live issues total within the execution layer
MAX 2 worker agents at a time globally may be in `in_progress`
```

**New Values:**
```
Max 4 live issues total within the execution layer
MAX 4 worker agents at a time globally may be in `in_progress`
```

**Per-Agent Limit:** Keep at 1 (prevents agent overload)

### Step 2: Update Pipeline Monitoring

**File:** `HEARTBEAT.md` (next heartbeat)
**Change:** Update pipeline compliance metrics to reflect new limits

**Current:** `Live Execution: 0/2`
**New:** `Live Execution: 0/4`

### Step 3: Create Sprint 20 Execution Plan

**File:** `plans/sprint-20-plan.md`
**Content:** 4 parallel execution tracks to utilize increased WIP capacity

**Proposed Tracks:**
1. **THE-321** (P1) — Filter Infrastructure Noise from Minerva
2. **THE-322** (P2) — Classify Recovery/Rework Events
3. **THE-323** (P2) — Recalibrate Success Rate KPI
4. **Sprint 20 Feature Work** — TBD based on strategic direction

### Step 4: Monitor and Adjust

**Tracking:** Monitor idle time in Sprint 20 Minerva report
**Success Criteria:** Idle time reduction from 99.41% to ≤50%
**Adjustment Trigger:** If coordination issues emerge, revert to WIP=3

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Coordination overhead increases | Medium | Low | Monitor Sprint 20 metrics, adjust if needed |
| Agent overload | Low | Medium | Keep per-agent WIP limit at 1 |
| Budget overrun | Low | High | Track costs per issue, halt if >$400 remaining |

---

## Expected Outcomes

- **Idle Time Reduction:** 99.41% → ~50%
- **Throughput Increase:** ~2x (double parallel execution capacity)
- **Agent Utilization:** 4/4 agents active (currently 2/4 max)

---

## Concrete Next Steps (Upon Approval)

1. **CTO:** Update CTO AGENTS.md WIP limits (2 → 4)
2. **CTO:** Create Sprint 20 execution plan with 4 parallel tracks
3. **CEO:** Decompose Sprint 20 into execution issues
4. **CTO:** Activate Wave 1 execution (up to 4 parallel issues)
5. **Minerva:** Track idle time reduction in Sprint 20 report

---

## Appendix: Current Pipeline State

| Metric | Current | After Implementation |
|--------|---------|---------------------|
| Max live issues | 2 | 4 |
| Max in_progress agents | 2 | 4 |
| Per-agent WIP | 1 | 1 (unchanged) |
| Execution agents | 4 | 4 |
| Idle agents (guaranteed) | 2 (50%) | 0 (0%) |

---

**CTO:** f3b65fd2-33db-4538-8cf6-d336adb5ed96
**Date:** 2026-07-24
**Status:** Pending CEO Approval
