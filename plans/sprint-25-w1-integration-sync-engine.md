# Sprint 25 — W1: Integration Sync Engine

**Parent:** THE-390 (Sprint 25)
**Suggested Issue ID:** THE-391 (or next available)
**Assignee:** BackendArchitect
**Status:** blocked (on Sprint 24 complete)
**Priority:** P1
**Estimated Cost:** $5-7

## Scope

Backend service that syncs Nexus entities bidirectionally with Jira, Linear, and GitHub Issues.

### Connectors

1. **Jira Connector**
   - REST API client (Jira Cloud REST API v3)
   - Project/issue/sprint sync
   - Webhook receiver for real-time updates
   - Authentication: API token or OAuth 2.0

2. **Linear Connector**
   - GraphQL API client
   - Team/issue/cycle sync
   - Webhook receiver
   - Authentication: API key

3. **GitHub Issues Connector**
   - REST API client (GitHub Issues API)
   - Issue/milestone sync
   - Webhook receiver
   - Authentication: Personal Access Token or GitHub App

### Sync Engine

- Polling-based sync with configurable intervals
- Bidirectional: create/update in external → reflected in Nexus
- Conflict resolution strategy (last-write-wins with timestamp tracking)
- Sync status tracking: last-sync timestamps, error logging, retry logic with exponential backoff
- Schema mapping: configurable mapping of external fields to Nexus entity fields

## DoD

- Jira connector functional with test project
- Linear connector functional with test team
- GitHub Issues connector functional with test repo
- Bidirectional sync: create/update in external → reflected in Nexus
- Sync status API returns per-connector health
- All existing backend tests pass (460/460)
- TSC clean

## Dependencies

- Sprint 24 complete (THE-373 → done) — no code dependency, only sequencing
- CTO OAuth/security review (advisory, post-implementation)

## Technical Notes

- Place connectors in `src/integrations/` directory
- Each connector gets its own subdirectory: `jira/`, `linear/`, `github/`
- Shared sync engine in `src/integrations/engine/`
- Use existing Prisma schema for Nexus entities
- Start with API tokens where possible; OAuth as enhancement
- Polling fallback if webhooks are unreliable
- Reference existing API patterns from `src/routes/`

## Iteration Limit

Max 6 loops. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.
