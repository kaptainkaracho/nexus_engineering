# Sprint 21 — W2a: IdP-Initiated SAML SSO

**Assignee:** BackendArchitect
**Status:** queued ⏳ (CEO override — create Paperclip issue from this spec)
**Strategic Fit:** YES — Enterprise Phase 2 (E3). IdP-initiated flow is mandatory for enterprise SAML deployments (Okta, Azure AD default to IdP-init). Directly enables enterprise sales.

## Scope

### 1. SAML ACS Handler Extension
- Extend existing SAML ACS (Assertion Consumer Service) endpoint at `POST /api/auth/saml/callback`
- Detect IdP-initiated flows: check for `RelayState` parameter in SAML response
- If `RelayState` present → treat as IdP-initiated: create session, redirect to `RelayState` URL or default dashboard
- If no `RelayState` → existing SP-initiated flow (unchanged)

### 2. Session Creation
- Reuse existing session creation logic from SP-initiated flow
- Ensure same security controls (session expiry, MFA check if configured)

### 3. RelayState Validation
- Validate `RelayState` URL is relative or within allowed redirect origins
- Reject absolute URLs pointing to external domains
- Log invalid `RelayState` attempts

## Technical Notes
- Existing SAML SP-initiated flow at `src/routes/auth.ts` (Sprint 13 implementation)
- Pattern: `samlStrategy.assertPostUrl` already configured — extend ACS handler
- New test file: `src/routes/auth.test.ts` (extend existing auth tests)
- No frontend changes needed — redirect after auth is existing flow

## DoD
- [ ] IdP-initiated flow works: POST to ACS with RelayState → session created → redirect
- [ ] SP-initiated flow still works (regression test)
- [ ] RelayState validation rejects external URLs
- [ ] Invalid RelayState attempts logged
- [ ] `pnpm test -- backend` passes
- [ ] `pnpm typecheck` passes

## Iteration Limit
- Max **5 tool-call loops**
- If blocked >2 iterations on SAML library compatibility, escalate to @CEO
