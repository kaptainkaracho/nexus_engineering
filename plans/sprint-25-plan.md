# Sprint 25 — Integration Ecosystem Phase 1

**Status:** Approved — Board approved 2026-07-27 via confirmation:THE-388:plan:sprint-25-v1
**Author:** CEO
**Date:** 2026-07-27
**Prerequisite:** Sprint 24 complete (W5fix → W5g → W6 E2E)
**Strategic Fit:** YES — Integration with Jira/Linear/GitHub extends traceability into the engineering workflow, directly accelerating the core "Engineering as Code Viewer and Traceability Platform" thesis.
**Budget Estimate:** $14-22 (3-4% of remaining ~$483)
**WIP Limit:** 4 (inherited)

## Strategic Rationale

Enterprise Phase 2 (Sprints 21-24) delivered the features required for enterprise procurement: SCIM provisioning, advanced RBAC, compliance reporting, self-hosted deployment. The platform is now feature-complete for enterprise evaluation.

The next unlock is **ecosystem integration**. Traceability is most valuable when it connects to the tools engineers already use. A Jira ticket that auto-links to the ADR, architecture spec, and test results is far more powerful than a standalone traceability graph.

### Key Insight

Currently, users must manually import requirements into Nexus. With bidirectional sync, Jira/Linear/GitHub Issues become the source of truth for requirements, and Nexus enriches them with traceability data automatically. This reduces friction to near-zero.

## Scope

### Wave 1: Integration Sync Engine (BackendArchitect)
**Est. Cost:** $5-7

- Jira connector: REST API client, project/issue/sprint sync, webhook receiver
- Linear connector: GraphQL API client, team/issue/cycle sync, webhook receiver
- GitHub Issues connector: REST API client, issue/milestone sync, webhook receiver
- Bidirectional sync engine: polling-based sync with conflict resolution
- Sync status tracking: last-sync timestamps, error logging, retry logic
- Schema mapping: configurable mapping of external fields to Nexus entity fields

**DoD:**
- Jira connector functional with test project
- Linear connector functional with test team
- GitHub Issues connector functional with test repo
- Bidirectional sync: create/update in external → reflected in Nexus
- Sync status API returns per-connector health
- All existing tests pass

### Wave 2: Integration Management UI (FrontendArchitect)
**Est. Cost:** $4-6

- Integration configuration panel (OAuth flow, API key setup, connection test)
- Connection status dashboard (health indicators, last-sync timestamps)
- Manual sync trigger per connector
- Mapping configuration UI (which Nexus entities ↔ external entities)
- UX Gate required (W2g)

**DoD:**
- OAuth or API-key configuration for all 3 connectors
- Connection test button with status feedback
- Sync status dashboard with error display
- Manual sync trigger
- TSC clean, frontend tests pass
- UX Gate approved

### Wave 2g: UX Gate — Integrations (UXDesigner)
**Est. Cost:** $1-2

- Gate review of Integration Management UI
- Verify OAuth flow clarity, connection status readability, sync trigger UX
- Initial status: `blocked` (on W2 in_review)

### Wave 3: Sprint 25 E2E Verification (Senior QA)
**Est. Cost:** $2-3

- E2E tests for all 3 connectors
- Bidirectional sync data integrity verification
- Regression suite on existing features
- Initial status: `blocked` (on all waves complete)

### Buffer: $2-4

## Resource Allocation

| Agent | Waves | Estimated Load |
|-------|-------|---------------|
| BackendArchitect | W1 (Sync Engine) | MEDIUM — 1 issue, ~2 days |
| FrontendArchitect | W2 (Integration UI) | MEDIUM — 1 issue, ~2 days |
| UXDesigner | W2g (UX Gate) | LOW — 1 gate review |
| Senior QA | W3 (E2E) | MEDIUM — 1 verification |
| CTO | Oversight: OAuth/security review | LOW — advisory |
| **Total Available:** 4 runners | | **4 issues** (W1+W2+W2g+W3) |

## Sequencing

```
Phase 1 (Parallel — W1 + W2):
  W1 (BA): Integration Sync Engine ──────────┐
  W2 (FA): Integration Management UI ────────┤
                                              │
Phase 2 (After W1+W2 → in_review):
  W2g (UXD): UX Gate ────────────────────────┤
                                              │
Phase 3 (After all done):
  W3 (QA): E2E Verification ─────────────────┘
```

W1 and W2 are independent after initial API contract agreement (BA provides API shapes, FA builds against them). This allows full 2-runner parallelism.

## Success Criteria

1. Jira connector: sync issues from a test project bidirectionally
2. Linear connector: sync issues from a test team bidirectionally
3. GitHub Issues connector: sync issues from a test repo bidirectionally
4. Integration management UI: configure, test, and monitor all 3 connectors
5. UX Gate approves integration configuration flow
6. E2E tests pass for all sync scenarios + regression suite
7. Budget under $22

## Dependencies on Sprint 24

Must wait for:
- W5fix (Compliance UX fixes) → done
- W5g re-review (UX Gate pass) → done
- W6 (E2E) → done
- Sprint 24 parent → done

This is an independent sprint — no cross-sprint code dependencies. Sprint 25 does not depend on Sprint 24's implementation artifacts, only on its completion for sequencing.

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OAuth complexity with Jira/Linear | Medium | Start with API tokens where possible; OAuth as enhancement |
| Webhook reliability across 3 platforms | Low | Polling fallback; exponential backoff on failures |
| Data model drift (Nexus vs external) | Medium | Configurable field mapping; strict schema versioning |
| Scope creep (too many connectors) | Low | Strict to 3: Jira, Linear, GitHub Issues. Others = documented future work |
| Sprint 24 delays | Low | Sprint 25 plan is independent — can start as soon as Sprint 24 done |
