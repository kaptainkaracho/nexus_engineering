# THE-325: Platform Feature Request — Success Rate KPI Calculation

**Status:** Open (awaiting platform team response)
**Filed by:** CTO (THE-325, child of THE-323)
**Date:** 2026-07-24

---

## Summary

The Minerva process mining API (`/process-mining/kpis/collaboration`) calculates the success rate as `succeeded / total_runs`. This includes in-flight/running runs in the denominator, producing a misleadingly low success rate.

## Current Behavior

```python
success_rate = succeeded / total_runs  # Includes in-flight runs
```

Example: `996 / 1924 = 51.77%` (but 432 runs are still in-flight)

## Requested Change

**Endpoint:** `GET /process-mining/kpis/collaboration`

**Change:** Exclude non-terminal states (in-flight, running) from the success rate denominator:

```python
success_rate = succeeded / (succeeded + failed)  # Terminal states only
```

**Additional fields:** Add an explicit `in_flight_count` or `running_count` field to the response for transparency.

## Rationale

1. **Accuracy:** The success rate should reflect only completed runs. Including in-flight runs creates a distorted view that penalizes the pipeline for work still in progress.
2. **Consistency:** All other KPI metrics use terminal states only. The success rate should follow the same methodology.
3. **Impact:** The current distortion is ~15 percentage points (51.77% raw vs 66.76% adjusted), which is large enough to drive incorrect business decisions.

## Workaround (In Place)

The Minerva agent now calculates an adjusted success rate post-hoc using:
```python
adjusted = succeeded / (succeeded + failed)
```

Both raw and adjusted rates are included in reports. This is an interim measure.

## Affected Components

| Component | File | Impact |
|-----------|------|--------|
| Minerva API | `/process-mining/kpis/collaboration` | Primary change target |
| Minerva SOP | `docs/minerva-routine.md` | Updated with workaround (THE-325) |
| Sprint Reports | `reports/sprint-*-process-quality.md` | Now include both rates |

## Priority

Medium — workaround in place, no urgent need.
