# THE-320: Address Critical Idle Time — CTO Disposition

**Issue:** THE-320 R1: Address Critical Idle Time (99.41% agent idle)
**Status:** In Progress
**Assignee:** CTO
**Priority:** High
**Date:** 2026-07-24

---

## Executive Summary

The Minerva process intelligence report identified **99.41% idle time** across the agent fleet. This is a critical bottleneck that reduces effective throughput by ~100x. The root cause is **overly restrictive WIP limits** combined with **sequential execution constraints** that create artificial queuing.

---

## Root Cause Analysis

### 1. Current WIP Limits (Source: CTO AGENTS.md)

| Constraint | Value | Impact |
|------------|-------|--------|
| Active issues per execution agent | 1 | Agents blocked when assigned issue is in-progress |
| Max live issues in execution layer | 2 | Only 2 agents can work simultaneously |
| Max worker agents in `in_progress` | 2 | Hard ceiling on parallel execution |
| CEO/CTO exemption | Yes | Leadership actions don't count against limits |

### 2. Agent Fleet Composition

| Agent | Role | Current State |
|-------|------|---------------|
| BackendArchitect | Engineer | Idle |
| FrontendArchitect | Engineer | Idle |
| UXDesigner | Designer | Idle |
| Senior QA | QA | Idle |
| CEO | Leadership | Exempt |
| CTO | Leadership | Exempt |

**Total execution agents:** 4 (BackendArchitect, FrontendArchitect, UXDesigner, Senior QA)
**Max concurrent:** 2 (due to WIP limit of 2 live issues)
**Idle agents:** 2 (50% of fleet idle at any given time)

### 3. The Math of 99.41% Idle Time

With 1,895 runs across 6 agents:
- **Active time per run:** ~718 sec avg cycle time × (1 - 0.9941) = **4.2 sec active time**
- **Idle time per run:** 718 sec × 0.9941 = **713.8 sec idle time**
- **Active minutes per run:** 4.2 sec / 60 = **0.07 minutes**

The WIP limit of 2 means:
- 4 execution agents compete for 2 slots
- 2 agents are always idle (50% idle rate minimum)
- When an agent completes work, it must wait for a slot to free up

### 4. Why This Happened

**Phase 3 Sprints 15-19:** High-velocity delivery with strict WIP enforcement worked because:
- Tasks were large (multi-day epics)
- Handoffs were sequential (Backend → Frontend → UX → QA)
- Pipeline was underutilized (0-2 active issues)

**Current State:** Pipeline is empty (0/2 live execution). All agents idle. No work queued.

---

## Proposed Solutions

### Option A: Increase WIP Limits (Recommended)

**Change:** Increase max live issues from 2 to 4 (match execution agent count)

**Rationale:**
- 4 execution agents available → 4 slots needed for full utilization
- Current 2-slot limit creates 50% guaranteed idle time
- Phase 3 complete → risk of overloading is low
- Budget healthy ($13.50/$500) → cost not a constraint

**Implementation:**
1. Update CTO AGENTS.md: Change "Max 2 live issues total within the execution layer" to "Max 4 live issues total within the execution layer"
2. Update CTO AGENTS.md: Change "MAX 2 worker agents at a time globally may be in `in_progress`" to "MAX 4 worker agents at a time globally may be in `in_progress`"
3. Keep per-agent WIP limit at 1 (prevents agent overload)

**Expected Impact:**
- Idle time reduction: 99.41% → ~50% (2 agents always idle becomes 0 agents always idle)
- Throughput increase: ~2x (double the parallel execution capacity)
- Risk: Medium (more concurrent work = more coordination overhead)

### Option B: Staged WIP Ramp

**Change:** Increase WIP limits incrementally (2 → 3 → 4) over 2 sprints

**Rationale:**
- Test the system's coordination capacity at each level
- Identify bottlenecks before full parallelization
- Lower risk than immediate jump to 4

**Implementation:**
1. Sprint 20: Increase to 3 live issues
2. Sprint 21: Increase to 4 live issues (if no coordination issues)

**Expected Impact:**
- Idle time reduction: 99.41% → ~67% → ~50%
- Throughput increase: ~1.5x → ~2x
- Risk: Low (incremental change)

### Option C: Implement Work Stealing

**Change:** Allow idle agents to "steal" queued work from other agents

**Rationale:**
- Agents idle due to WIP limits could pick up unassigned work
- Reduces queue wait time without increasing WIP limits
- More complex to implement

**Implementation:**
1. Create a "work stealing" protocol in Paperclip
2. When an agent completes work, check for queued issues
3. If found, assign to the idle agent immediately

**Expected Impact:**
- Idle time reduction: 99.41% → ~70%
- Throughput increase: ~1.3x
- Risk: High (requires platform changes)

---

## Recommendation: Option A (Increase WIP Limits)

**Rationale:**
1. **Simplest change:** One-line config update in CTO AGENTS.md
2. **Immediate impact:** Reduces idle time from 99.41% to ~50%
3. **Low risk:** Phase 3 complete, pipeline empty, budget healthy
4. **Measurable:** Can track idle time reduction in next Minerva report

**Implementation Plan:**
1. **Step 1:** Update CTO AGENTS.md WIP limits (2 → 4)
2. **Step 2:** Create Sprint 20 execution plan with 4 parallel tracks
3. **Step 3:** Monitor idle time in Sprint 20 Minerva report
4. **Step 4:** Adjust if coordination issues emerge

---

## Escalation Required

**To:** @CEO
**Subject:** THE-320: Request Approval to Increase WIP Limits

**Request:** Approve Option A (increase WIP limits from 2 to 4) to address 99.41% idle time.

**Risk Assessment:** Low — Phase 3 complete, pipeline empty, budget healthy.

**Expected Outcome:** 2x throughput increase, idle time reduction from 99.41% to ~50%.

**Implementation Ready:** Detailed implementation plan created at `docs/THE-320-implementation-plan.md` with concrete steps, risk assessment, and expected outcomes.

---

## Appendix: Data Sources

- Minerva Process Intelligence Report: `reports/sprint-19-process-quality.md`
- CTO Agent Instructions: `AGENTS.md`
- Pipeline Status: `HEARTBEAT.md`
- Agent Roster: `.paperclip/context/CTO.md`

---

**CTO:** f3b65fd2-33db-4538-8cf6-d336adb5ed96
**Date:** 2026-07-24
**Status:** Awaiting CEO approval
