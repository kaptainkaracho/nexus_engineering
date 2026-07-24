# Platform Feature Request: Success Rate KPI Calculation Fix

**Filed by:** CTO (The Bike App / Nexus)
**Date:** 2026-07-24
**Related Issues:** THE-323, THE-325
**Priority:** Medium
**Component:** Process Mining API (`/process-mining/kpis/collaboration`)

---

## Summary

The success rate calculation in the process mining API includes non-terminal runs (in-flight, queued, running) in the denominator, producing an artificially low success rate that doesn't reflect actual task completion outcomes.

## Current Behavior

**Endpoint:** `GET /process-mining/kpis/collaboration`

**Response includes:**
```json
{
  "success_rate": 0.5177,
  "failure_rate": 0.2578,
  "total_runs": 1924,
  "succeeded": 996,
  "failed": 496
}
```

**Calculation:** `success_rate = succeeded / total_runs = 996 / 1924 ≈ 51.77%`

**Problem:** `succeeded + failed = 1492`, but `total_runs = 1924`. The delta (432 runs) represents non-terminal states (running, queued, pending) that are neither successes nor failures yet.

## Expected Behavior

**Correct calculation:** `success_rate = succeeded / (succeeded + failed) = 996 / 1492 ≈ 66.76%`

Non-terminal runs should be excluded from the success rate denominator because:
1. They are not terminal outcomes — they may succeed or fail
2. Including them dilutes the signal of actual completion quality
3. The metric should reflect "of completed work, what percentage succeeded?" not "of all work including in-progress, what percentage succeeded?"

## Proposed Fix

### Option 1: Fix Calculation (Recommended)

Modify the KPI aggregation endpoint to calculate success rate as:
```
success_rate = succeeded / (succeeded + failed)
```

Add explicit fields for transparency:
```json
{
  "success_rate": 0.6676,
  "failure_rate": 0.3324,
  "terminal_runs": 1492,
  "in_flight_runs": 432,
  "succeeded": 996,
  "failed": 496,
  "total_runs": 1924
}
```

### Option 2: Add Separate Metric

Keep existing `success_rate` for backward compatibility, add:
```json
{
  "success_rate": 0.5177,
  "terminal_success_rate": 0.6676,
  "in_flight_count": 432
}
```

## Impact

- **Current distortion:** ~15 percentage points below true terminal rate
- **Consumer impact:** Dashboard shows misleading success metric
- **Workaround applied:** Client-side compensation in Nexus app (THE-325)

## Acceptance Criteria

1. `success_rate` excludes non-terminal runs from denominator
2. Response includes `in_flight_runs` or `running` count for transparency
3. Backward compatible (existing consumers won't break)
4. Documentation updated to clarify metric definition

## Workaround Status

The Bike App (Nexus) has implemented client-side compensation:
- `SuccessRateKPI.tsx` component displays adjusted rate as primary value
- Minerva reports include both raw and adjusted rates
- SOP updated to document the adjustment methodology

This workaround is fragile (depends on API response format) and doesn't fix the signal for other consumers. Platform-level fix preferred.

---

**Contact:** CTO via Paperclip issue tracker
**Repository:** `The_Bike_App` (Nexus)
**Labels:** `process-mining`, `kpi`, `bug`, `api`
