# Sprint 25 — W3: Sprint 25 E2E Verification

**Parent:** THE-390 (Sprint 25)
**Suggested Issue ID:** THE-394 (or next available)
**Assignee:** Senior QA
**Status:** blocked (on all waves complete)
**Priority:** P1
**Estimated Cost:** $2-3

## Scope

End-to-end verification of all Sprint 25 deliverables.

## Test Scenarios

1. **Connector Configuration**
   - Configure Jira connector with test project
   - Configure Linear connector with test team
   - Configure GitHub Issues connector with test repo

2. **Bidirectional Sync**
   - Create issue in Jira → verify it appears in Nexus
   - Update issue in Linear → verify update reflected in Nexus
   - Create issue in Nexus → verify it syncs to GitHub
   - Delete issue in external → verify status change in Nexus

3. **UI Verification**
   - Connection dashboard renders correctly
   - Manual sync trigger works
   - Error states display correctly

4. **Regression Suite**
   - All existing E2E scenarios still pass
   - No breaking changes to existing features

## Dependencies

- W1 (Integration Sync Engine) → done
- W2 (Integration Management UI) → done  
- W2g (UX Gate) → approved

## Gate Initialization Rule

This issue starts as `blocked`. Transition to `queued` → `in_progress` only when all Sprint 25 waves done. Chain: All waves done → W3 in_progress → W3 passed → Sprint 25 parent done.

## Output

E2E test report with pass/fail per scenario. All tests must pass for Sprint 25 sign-off.
