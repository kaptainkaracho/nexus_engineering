# Sprint 25 — W2g: UX Gate — Integrations

**Parent:** THE-390 (Sprint 25)
**Suggested Issue ID:** THE-393 (or next available)
**Assignee:** UXDesigner
**Status:** blocked (on W2 in_review)
**Priority:** P1
**Estimated Cost:** $1-2

## Scope

Gate review of Integration Management UI (W2). Verify OAuth/API-key configuration flow, connection status dashboard readability, manual sync trigger UX, and mapping configuration clarity.

## Gate Criteria

1. **OAuth/API-Key Configuration Flow**
   - Clear instructions for obtaining API credentials
   - Secure input handling (masked API keys)
   - Validation feedback on save

2. **Connection Status Dashboard**
   - Health indicators are distinguishable (connected/disconnected/error)
   - Last-sync timestamps are human-readable
   - Error messages are actionable

3. **Manual Sync Trigger**
   - "Sync Now" button is discoverable
   - Progress indicator during sync
   - Success/failure feedback after sync

4. **Mapping Configuration**
   - Entity/field mapping table is scannable
   - Save feedback is clear
   - Error states handled

## Dependencies

- W2 (Integration Management UI) → in_review

## Output

Gate review report with findings categorized as CRITICAL / MEDIUM / LOW. Verdict: APPROVED or CHANGES REQUESTED.

## Gate Initialization Rule

This issue starts as `blocked`. Transition to `queued` → `in_progress` only when W2 → in_review. Chain: W2 in_review → W2g in_progress → W2g approved → W2 done.
