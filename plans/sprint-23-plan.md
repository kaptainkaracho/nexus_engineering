# Sprint 23 — SCIM 2.0 Implementation

**Status:** Proposed (CEO recommendation, board approval required)
**Strategic Fit:** YES — Enterprise Phase 2 core. SCIM 2.0 automated user provisioning is mandatory for enterprise procurement (Okta, Azure AD, OneLogin).
**Prerequisite:** SCIM Data Model + API Design complete (THE-348, Sprint 21 W2b)
**Date:** 2026-07-26
**Budget Estimate:** $8-10 (well within $484.45 remaining)

---

## Sprint Goal

Implement SCIM 2.0 provisioning to enable automated user lifecycle management via enterprise identity providers.

---

## Wave Plan

| Wave | Scope | Assignee | Dependencies |
|------|-------|----------|-------------|
| **Wave 1** | SCIM 2.0 Backend API (User CRUD + Group CRUD) | BackendArchitect | None |
| **Wave 2** | SCIM 2.0 Frontend Admin UI | FrontendArchitect | Wave 1 API complete |
| **Wave 3** | SCIM 2.0 Integration Testing + E2E | Senior QA | Waves 1-2 complete |
| **Wave 4** | UX Gate + Polish | UXDesigner | Wave 2 complete |

---

## Issue Breakdown

### Wave 1: SCIM 2.0 Backend API (BackendArchitect)
Based on THE-348 OpenAPI spec and attribute mapping:

1. **User Endpoints:**
   - `POST /api/scim/Users` — Create user
   - `GET /api/scim/Users` — List/filter users (SCIM filtering, pagination)
   - `GET /api/scim/Users/{id}` — Get user
   - `PUT /api/scim/Users/{id}` — Full update
   - `PATCH /api/scim/Users/{id}` — Partial update
   - `DELETE /api/scim/Users/{id}` — Deactivate user

2. **Group Endpoints:**
   - `POST /api/scim/Groups` — Create group
   - `GET /api/scim/Groups` — List groups
   - `PUT /api/scim/Groups/{id}` — Update group
   - `DELETE /api/scim/Groups/{id}` — Delete group

3. **SCIM Protocol Compliance:**
   - Bearer token authentication
   - SCIM schema validation (`urn:ietf:params:scim:schemas:core:2.0:User`)
   - Filtering support (`filter=userName eq "jdoe"`)
   - Pagination (`startIndex`, `count`)
   - Error responses per RFC 7644

**DoD:**
- [ ] All 10 endpoints implemented and tested
- [ ] SCIM schema validation passes
- [ ] `pnpm test -- backend` passes
- [ ] OpenAPI spec updated with final implementation

### Wave 2: SCIM 2.0 Frontend Admin UI (FrontendArchitect)
1. **SCIM Configuration Panel:**
   - Enable/disable SCIM provisioning toggle
   - Display SCIM endpoint URL and bearer token
   - Token regeneration

2. **Provisioned Users View:**
   - Table of SCIM-provisioned users with status (active/inactive)
   - Last sync timestamp
   - Source IdP display

3. **Provisioned Groups View:**
   - Table of SCIM-provisioned groups
   - Member count
   - Role mapping display

**DoD:**
- [ ] SCIM config panel renders and functions
- [ ] Provisioned users table with filters
- [ ] Provisioned groups table
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test -- frontend` passes

### Wave 3: Integration Testing + E2E (Senior QA)
1. **Unit Tests:** User/Group CRUD operations
2. **Integration Tests:** SCIM protocol compliance (filtering, pagination, error handling)
3. **E2E Tests:** Full provisioning flow (create user via SCIM → verify in Nexus → deactivate → verify removal)
4. **Edge Cases:** Duplicate user handling, group membership sync, token expiry

**DoD:**
- [ ] All unit tests pass
- [ ] Integration tests verify SCIM compliance
- [ ] E2E tests cover full provisioning lifecycle
- [ ] `pnpm test` passes globally

### Wave 4: UX Gate + Polish (UXDesigner)
1. Review SCIM admin UI for UX consistency
2. Verify accessibility (keyboard navigation, screen reader)
3. Check responsive layout
4. Provide design token guidance if needed

**DoD:**
- [ ] UX Gate review complete
- [ ] All findings addressed or documented as known issues
- [ ] UX Gate passed

---

## Success Criteria

1. SCIM 2.0 endpoints operational and protocol-compliant
2. Admin UI for SCIM configuration and monitoring
3. Full test coverage (unit + integration + E2E)
4. UX Gate passed
5. Budget under $10

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SCIM protocol complexity (filtering, pagination) | Medium | Follow OpenAPI spec from THE-348 exactly |
| Enterprise IdP integration testing | High | Mock IdP responses for unit/integration tests |
| Scope creep on admin UI | Medium | Strict per-wave DoD; limit to config + monitoring views |
