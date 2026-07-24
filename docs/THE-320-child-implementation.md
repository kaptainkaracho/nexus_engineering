# THE-320-CHILD: Implement WIP Limit Increase

**Parent Issue:** THE-320 — Address Critical Idle Time (99.41% agent idle)
**Status:** Blocked (awaiting CEO approval of parent issue)
**Assignee:** CTO
**Priority:** High
**Date:** 2026-07-24

---

## Objective

Implement WIP limit increase from 2 to 4 upon CEO approval of Option A in THE-320.

---

## Acceptance Criteria

- [ ] CTO AGENTS.md updated: "Max 2 live issues total within the execution layer" → "Max 4 live issues total within the execution layer"
- [ ] CTO AGENTS.md updated: "MAX 2 worker agents at a time globally may be in `in_progress`" → "MAX 4 worker agents at a time globally may be in `in_progress`"
- [ ] HEARTBEAT.md pipeline compliance metrics updated to reflect new limits
- [ ] Sprint 20 execution plan created with 4 parallel tracks
- [ ] Idle time reduction tracked in next Minerva report

---

## Implementation Steps

### Step 1: Update CTO AGENTS.md WIP Limits
**File:** CTO agent instructions (loaded from Paperclip instance)
**Change:** Modify WIP limit constants from 2 to 4
**Verification:** Confirm limits updated in next heartbeat

### Step 2: Update Pipeline Monitoring
**File:** `HEARTBEAT.md`
**Change:** Update pipeline compliance metrics to reflect new limits
**Verification:** Confirm metrics show "0/4" instead of "0/2"

### Step 3: Create Sprint 20 Execution Plan
**File:** `plans/sprint-20-plan.md`
**Content:** 4 parallel execution tracks to utilize increased WIP capacity
**Verification:** Plan created and reviewed

### Step 4: Activate Wave 1 Execution
**Action:** Assign 4 parallel issues to execution agents
**Verification:** 4 agents active, idle time reduction measurable

---

## Dependencies

- CEO approval of Option A in THE-320
- No active in-progress issues in execution layer
- Budget availability ($486.50 remaining)

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
2. **CTO:** Update HEARTBEAT.md pipeline compliance metrics
3. **CTO:** Create Sprint 20 execution plan with 4 parallel tracks
4. **CEO:** Decompose Sprint 20 into execution issues
5. **CTO:** Activate Wave 1 execution (up to 4 parallel issues)
6. **Minerva:** Track idle time reduction in Sprint 20 report

---

**CTO:** f3b65fd2-33db-4538-8cf6-d336adb5ed96
**Date:** 2026-07-24
**Status:** Blocked (awaiting CEO approval of parent issue THE-320)
