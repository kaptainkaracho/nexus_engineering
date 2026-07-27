# Sprint 25 — W2: Integration Management UI

**Parent:** THE-390 (Sprint 25)
**Suggested Issue ID:** THE-392 (or next available)
**Assignee:** FrontendArchitect
**Status:** blocked (on Sprint 24 complete + W1 API contract)
**Priority:** P1
**Estimated Cost:** $4-6

## Scope

Frontend UI for configuring and monitoring integration connectors.

### Components

1. **Integration Configuration Panel**
   - OAuth flow or API key setup per connector type
   - Connection test button with status feedback
   - Per-connector settings form

2. **Connection Status Dashboard**
   - Health indicators (connected/disconnected/error) per connector
   - Last-sync timestamps
   - Error display with retry actions
   - Sync history log

3. **Manual Sync Trigger**
   - "Sync Now" button per connector
   - Sync progress indicator
   - Sync result display

4. **Mapping Configuration UI**
   - Which Nexus entities ↔ external entities
   - Field mapping table
   - Save/test mapping functionality

## DoD

- OAuth or API-key configuration for all 3 connectors
- Connection test button with status feedback
- Sync status dashboard with error display
- Manual sync trigger functional
- TSC clean
- Frontend tests pass (168/168)
- UX Gate approved (W2g)

## Dependencies

- Sprint 24 complete (THE-373 → done)
- W1 API contract: BackendArchitect provides API shapes before FA builds (initial contract via shared types)
- W2g: UX Gate review (blocked on W2 in_review)

## Technical Notes

- Place UI components in `src/views/Integrations/`
- Follow existing patterns from ComplianceDashboard and RoleManagement views
- Use lucide-react for icons (consistent with existing codebase)
- Use shadcn/ui components (Select, Button, Card, Badge, Dialog)
- Responsive layout for dashboard view
- Reference existing API client patterns from `src/api/client.ts`
- Status polling via React Query or setInterval with cleanup

## API Contract (to coordinate with W1)

- `GET /api/integrations` — List configured connectors with status
- `POST /api/integrations/:type/configure` — Save connector config
- `POST /api/integrations/:type/test` — Test connection
- `POST /api/integrations/:type/sync` — Trigger manual sync
- `GET /api/integrations/:type/sync-status` — Get sync status/history

## Iteration Limit

Max 6 loops. If blocked for more than 2 iterations, halt, log reason, and escalate to @CEO.
