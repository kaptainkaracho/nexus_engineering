# BackendArchitect Context State
> Last updated: 2026-08-05 — CTO delegation: THE-426 (Sprint 27 W1: OpenAPI Docs) routed to BA.

## Completed Work
| Issue | Title | Status | Summary |
|-------|-------|--------|---------|
| THE-330 | Route Hardening (18 routes) | ✅ **done** | AppError refactoring |
| THE-322/340 | Minerva BPMN Ingestion Pipeline | ✅ **done** | 1314 lines, 9 files |
| THE-347 | IdP-Initiated SAML SSO | ✅ **done** | Extended ACS handler |
| THE-348 | SCIM Data Model + API Design | ✅ **done** | OpenAPI spec, attribute mapping |
| THE-361 | SCIM 2.0 User Endpoints | ✅ **done** | 6 endpoints |
| THE-362 | SCIM 2.0 Group Endpoints | ✅ **done** | 5 endpoints |
| THE-375 | License key validation stub | ✅ **done** | POST /api/license/validate |
| THE-378 | W4: Compliance Backend | ✅ **done** | Reports DB, PDF/CSV/JSON export |
| THE-389 | W5fix: Compliance UX Fixes | ✅ **done** | UX fixes committed |
| THE-391 | W1: Integration Sync Engine | ✅ **done** | 4 commits (connectors, webhooks, polling, tests) |
| THE-405 | W3: GTM Docs & Guides | ✅ **done** | Sprint 26 complete |

## Active Assignment: THE-426 — Sprint 27 W1: Auto-Generated OpenAPI Docs
**Delegated by CTO** per sprint plan `plans/sprint-27-docs-and-dx.md`. Original owner: BackendArchitect.

**Scope:**
1. Auto-generate OpenAPI 3.x spec from Fastify route schemas
2. Publish as static HTML page within the app (e.g. `/api/docs`)
3. Include example requests/responses for all major endpoints

**Technical Approach:**
- Install `@fastify/swagger` + `@fastify/swagger-ui` for auto-generation
- Add JSON Schema to route definitions where missing (many routes may lack schemas)
- Generate OpenAPI spec and serve via Swagger UI
- Fallback: if route schemas are too sparse for auto-generation, manually author `docs/openapi/openapi.yaml` and serve it statically

**Current route inventory** (36 route files, ~25 route modules):
- auth, requirements, artifactRegistry, scan, multiRepo, rac, aac, organizations, registry, auditLog, tac, results, features, traceability, traceabilityLinks, nlQuery, liveness, recoveryRework, scim, rbac, license, demo, graphRoutes, impactReport, traceGate

**DoD:**
1. OpenAPI spec generated (either auto from schemas or manual YAML)
2. `/api/docs` serves Swagger UI with all endpoints documented
3. At least 5 major endpoints include example request/response bodies
4. TSC clean in backend scope
5. No test regressions

**Constraints:**
- Max 6 tool calls (per sprint plan)
- If existing route schemas are insufficient for auto-generation, prefer manual spec authoring over retrofitting all routes
- Existing docs/api/ openapi files may be useful references
- Do not modify frontend — this is backend-only scope

## Next Action
- [ ] **EXECUTE THE-426** — Install swagger plugins, generate OpenAPI spec, serve at /api/docs.
