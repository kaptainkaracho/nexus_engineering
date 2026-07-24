# Sprint 21 — W2b: SCIM Data Model + API Design (Design Only)

**Assignee:** BackendArchitect
**Status:** queued ⏳ (sequential after W2a)
**Strategic Fit:** YES — Enterprise Phase 2 (E2 prep). SCIM 2.0 is mandatory for automated user provisioning (Okta, Azure AD, OneLogin). Design phase only — implementation deferred to Sprint 22.

## Scope

### 1. SCIM 2.0 Mapping Document
- Map Nexus data model to SCIM 2.0 schema (`urn:ietf:params:scim:schemas:core:2.0:User`, `urn:ietf:params:scim:schemas:core:2.0:Group`)
- Define custom extensions for Nexus-specific attributes (org role, traceability permissions)
- Document attribute mapping table (Nexus field ↔ SCIM attribute ↔ SCIM data type)

### 2. OpenAPI Spec for SCIM Endpoints
- `POST /api/scim/Users` — Create user
- `GET /api/scim/Users` — List/filter users
- `GET /api/scim/Users/{id}` — Get user
- `PUT /api/scim/Users/{id}` — Update user
- `PATCH /api/scim/Users/{id}` — Partial update
- `DELETE /api/scim/Users/{id}` — Deactivate user
- `GET /api/scim/Groups` — List groups
- `POST /api/scim/Groups` — Create group
- `PUT /api/scim/Groups/{id}` — Update group
- Follow SCIM 2.0 filtering (`filter=userName eq "jdoe"`), pagination (`startIndex`, `count`), sorting

### 3. Implementation Readiness Assessment
- Identify which routes can reuse existing auth/org middleware
- Identify gaps (e.g., no `PATCH` support in current API patterns)
- Estimate effort for Sprint 22 implementation

## DoD
- [ ] SCIM attribute mapping document committed at `docs/scim-attribute-mapping.md`
- [ ] OpenAPI spec committed at `docs/openapi/scim.yaml`
- [ ] Implementation readiness assessment committed at `docs/scim-readiness-assessment.md`
- [ ] All documents reviewed by CTO

## Iteration Limit
- Max **3 tool-call loops** (documentation only)
