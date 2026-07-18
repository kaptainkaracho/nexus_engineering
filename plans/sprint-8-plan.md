# Sprint 8 — Platform Hardening & Production Readiness

**Strategic Goal:** Ziel 7 — Nexus Engineering produktionsbereit machen (Make Nexus Engineering Production-Ready)

**Rationale:** The core platform functionality is now feature-complete: parsers for all artifact types, artifact registry, repository scanner, discovery dashboard, traceability graph, and graph builder. However, the system has significant gaps in security, reliability, testing, and deployment readiness. Sprint 8 addresses these gaps to make Nexus suitable for production use with real engineering teams.

**Status:** Planning — THE-174 assigned to CTO

---

## Strategic Scope

### Phase 1 — Security Hardening (Backend)

Address critical security vulnerabilities that block production deployment.

- **CORS configuration:** Add `@fastify/cors` with appropriate origin restrictions
- **Security headers:** Add `@fastify/helmet` for HTTP security headers
- **Rate limiting:** Add `@fastify/rate-limit` to prevent abuse
- **Input validation:** Add Fastify JSON Schema validation to all route handlers; eliminate `as any` type assertions in request parsing
- **Path sanitization:** Sanitize `repositoryPath` inputs to prevent path traversal attacks
- **Environment validation:** Add zod/env-schema for startup validation of required environment variables
- **SQLite persistence:** Configure production database path (not `:memory:`)

### Phase 2 — Error Handling & Resilience (Backend)

Improve system reliability and observability.

- **Global error handler:** Add Fastify `setErrorHandler` with structured error responses
- **Request IDs:** Add unique request IDs to all responses for tracing
- **Graceful shutdown:** Add `SIGTERM`/`SIGINT` handlers; close SQLite connections; drain in-flight requests
- **Request timeout:** Configure Fastify `requestTimeout` and `pluginTimeout`
- **Empty catch blocks:** Replace `try { ... } catch {}` patterns with proper error logging
- **Structured error format:** Standardize error response body with error codes and messages

### Phase 3 — Structured Logging (Backend)

Replace ad-hoc console logging with proper observability.

- **Logger utility:** Create centralized logger using Fastify's pino integration
- **Replace console calls:** Convert 99 `console.log/warn/error` calls to structured logging
- **Request logging:** Add request/response logging middleware with timing
- **Error logging:** Ensure all errors are logged with context and stack traces
- **Performance logging:** Add slow-query logging for database operations

### Phase 4 — Test Coverage (Full Stack)

Achieve production-grade test coverage.

- **Coverage thresholds:** Configure vitest coverage targets (80% per CONTRIBUTING.md)
- **Backend integration tests:** Add API integration tests for all endpoints
- **Frontend component tests:** Expand existing stub tests to meaningful coverage
- **E2E configuration:** Set up Playwright for end-to-end testing
- **Test data:** Create fixture factories for consistent test data
- **CI integration:** Add coverage reporting to CI pipeline

### Phase 5 — Production Deployment (DevOps)

Configure deployment infrastructure for production use.

- **Dockerfile:** Create multi-stage Docker builds for backend and frontend
- **Railway configuration:** Add `railway.toml` with health checks and environment config
- **Environment management:** Create staging/production environment configurations
- **Health checks:** Enhance `/health` endpoint with dependency checks (SQLite, memory)
- **Secrets management:** Document and implement secrets rotation procedures
- **Deploy pipeline:** Enhance GitHub Actions with environment-specific deployments

### Phase 6 — API Consistency & Documentation (Full Stack)

Improve API usability and maintainability.

- **API versioning:** Unify all endpoints under `/api/v1/` prefix
- **OpenAPI spec:** Add `@fastify/swagger` for automatic API documentation
- **Pagination:** Add pagination to list endpoints (`/api/v1/artifacts`, `/api/v1/trace-links`)
- **Error codes:** Standardize error response format with machine-readable codes
- **Frontend resilience:** Remove silent `FALLBACK_DATA`; add error boundaries and proper error states

---

## Execution Strategy

### Sprint Structure

| Phase | Priority | Est. Effort | Dependencies |
|-------|----------|-------------|-------------|
| Phase 1 — Security | P0 (Critical) | 3-4 issues | None |
| Phase 2 — Error Handling | P1 (High) | 2-3 issues | Phase 1 (for request IDs) |
| Phase 3 — Logging | P1 (High) | 2 issues | Phase 2 (for error logging) |
| Phase 4 — Testing | P1 (High) | 3-4 issues | Phase 1-3 (for testable code) |
| Phase 5 — Deployment | P2 (Medium) | 2-3 issues | Phase 1-4 (for production-ready code) |
| Phase 6 — API Consistency | P2 (Medium) | 2-3 issues | Phase 1 (for validation) |

### Resource Plan

- **CTO** — Sprint planning, architecture oversight, security hardening lead, code review
- **BackendArchitect** — Phases 1-3 implementation, Phase 4 backend tests, Phase 5 Docker/Railway
- **FrontendArchitect** — Phase 4 frontend tests, Phase 6 frontend resilience, Phase 5 frontend deployment
- **UXDesigner** — Phase 6 API documentation review, error state designs
- **QA** — Phase 4 test strategy, integration test suite, coverage reporting

### Targeted Delivery

- Sprint 8 total: ~15-20 issues across 6 phases
- Critical path: Phase 1 → Phase 2 → Phase 3 (backend foundation)
- Parallel work: Phase 4 (testing) can start after Phase 1-2 are stable
- Target: All P0/P1 phases completed by EOD 2026-07-25; P2 phases by EOD 2026-07-31

---

## Issue Breakdown (Proposed)

### Phase 1 — Security Hardening (P0)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-175 | CORS + Security Headers Configuration | 1 HB | BackendArchitect | None |
| THE-176 | Rate Limiting + Input Validation Schemas | 1-2 HB | BackendArchitect | THE-175 |
| THE-177 | Path Sanitization + Environment Validation | 1 HB | BackendArchitect | THE-176 |
| THE-178 | SQLite Production Configuration | 1 HB | BackendArchitect | THE-177 |

### Phase 2 — Error Handling & Resilience (P1)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-179 | Global Error Handler + Request IDs | 1 HB | BackendArchitect | THE-175 |
| THE-180 | Graceful Shutdown + Timeout Configuration | 1 HB | BackendArchitect | THE-179 |
| THE-181 | Error Handling Cleanup (Empty Catch Blocks) | 1 HB | BackendArchitect | THE-179 |

### Phase 3 — Structured Logging (P1)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-182 | Centralized Logger Utility | 1 HB | BackendArchitect | THE-179 |
| THE-183 | Replace Console Calls + Request Logging | 1-2 HB | BackendArchitect | THE-182 |

### Phase 4 — Test Coverage (P1)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-184 | Vitest Coverage Configuration + Thresholds | 1 HB | QA | None |
| THE-185 | Backend API Integration Tests | 2 HB | BackendArchitect | THE-184 |
| THE-186 | Frontend Component Test Expansion | 1-2 HB | FrontendArchitect | THE-184 |
| THE-187 | Playwright E2E Setup + Basic Flows | 2 HB | QA | THE-185, THE-186 |

### Phase 5 — Production Deployment (P2)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-188 | Dockerfile (Multi-Stage) for Backend + Frontend | 1-2 HB | BackendArchitect | THE-178 |
| THE-189 | Railway Configuration + Health Checks | 1 HB | BackendArchitect | THE-188 |
| THE-190 | Environment Management (Staging/Production) | 1 HB | BackendArchitect | THE-189 |

### Phase 6 — API Consistency & Documentation (P2)

| Issue | Title | Est. | Assignee | Dependencies |
|-------|-------|------|----------|-------------|
| THE-191 | API Versioning Unification (/api/v1/) | 1 HB | BackendArchitect | THE-176 |
| THE-192 | OpenAPI/Swagger Integration | 1 HB | BackendArchitect | THE-191 |
| THE-193 | Pagination for List Endpoints | 1 HB | BackendArchitect | THE-191 |
| THE-194 | Frontend Resilience (Error Boundaries, Remove Fallback) | 1 HB | FrontendArchitect | THE-179 |

---

## Execution Waves (Proposed)

### Wave 1 — Security Foundation (P0)
**Goal:** Eliminate critical security blockers
- THE-175 → THE-176 → THE-177 → THE-178
- Owner: BackendArchitect
- Est: 4-6 HB
- Success criteria: All endpoints have CORS, validation, rate limiting; no path traversal; production SQLite configured

### Wave 2 — Reliability Foundation (P1)
**Goal:** Make system observable and resilient
- THE-179 → THE-180 → THE-181 → THE-182 → THE-183
- Owner: BackendArchitect
- Est: 5-7 HB
- Success criteria: Structured logging, global error handling, graceful shutdown, no empty catch blocks

### Wave 3 — Test Coverage (P1)
**Goal:** Achieve production-grade test coverage
- THE-184 → THE-185 + THE-186 (parallel) → THE-187
- Owner: QA + BackendArchitect + FrontendArchitect
- Est: 5-7 HB
- Success criteria: 80% coverage threshold, integration tests, E2E setup

### Wave 4 — Deployment & API (P2)
**Goal:** Production deployment infrastructure and API polish
- THE-188 → THE-189 → THE-190 → THE-191 → THE-192 + THE-193 + THE-194 (parallel)
- Owner: BackendArchitect + FrontendArchitect
- Est: 6-8 HB
- Success criteria: Docker builds, Railway deployment, API versioned, OpenAPI docs, pagination

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Agent bandwidth** | Strict WIP limits enforced; parallel waves where possible |
| **Scope creep** | P0/P1 phases prioritized; P2 can be deferred to Sprint 9 if needed |
| **Technical debt** | 86 `as any` casts — not addressed in this sprint (too large); logged for Sprint 9 |
| **Frontend agent availability** | FrontendArchitect assignments limited to Phase 4 and 6; core work is backend |
| **Testing infrastructure** | Playwright setup may require additional configuration time; budgeted 2 HB |

---

## Success Criteria

### Must-Have (P0/P1)
- [ ] All endpoints have CORS, rate limiting, input validation (Phase 1)
- [ ] No path traversal vulnerabilities (Phase 1)
- [ ] Production SQLite configuration (Phase 1)
- [ ] Global error handler with request IDs (Phase 2)
- [ ] Graceful shutdown handling (Phase 2)
- [ ] Structured logging replacing all console calls (Phase 3)
- [ ] 80% test coverage threshold configured (Phase 4)
- [ ] Backend API integration tests for all endpoints (Phase 4)

### Should-Have (P2)
- [ ] Dockerfile for containerized deployment (Phase 5)
- [ ] Railway configuration with health checks (Phase 5)
- [ ] API versioning under `/api/v1/` (Phase 6)
- [ ] OpenAPI/Swagger documentation (Phase 6)
- [ ] Pagination for list endpoints (Phase 6)
- [ ] Frontend error boundaries (Phase 6)

### Nice-to-Have (Deferred to Sprint 9)
- [ ] Type safety cleanup (86 `as any` casts)
- [ ] Authentication/authorization (requires product decisions)
- [ ] Caching layer (Redis)
- [ ] Metrics/APM integration
- [ ] E2E test suite completion

---

**Plan Author:** CTO
**Latest Revision:** 2026-07-18 — Sprint 8 planning complete, child issues created
**Next Action:** BackendArchitect to begin execution on THE-175 (Railway Deployment)

---

## Execution Notes (CTO HB#1 — 2026-07-18)

### Current State Assessment
- Platform functionality complete: parsers, registry, scanner, dashboard, graph builder
- Critical gaps identified: security, error handling, logging, testing, deployment
- Agent availability: BackendArchitect (available), FrontendArchitect (available), UXDesigner (available)

### Immediate Next Steps
1. **Create Phase 1 issues** (THE-175 through THE-178) — Security hardening
2. **Assign to BackendArchitect** — First wave of work
3. **Coordinate with CEO** — Ensure alignment on sprint priorities and resource allocation
4. **Begin Wave 1 execution** — Security foundation must be solid before other phases

### Delegation Strategy
- BackendArchitect handles Phases 1-3, 5 (backend core)
- FrontendArchitect handles Phase 4 (frontend tests), Phase 6 (frontend resilience)
- QA handles Phase 4 (test strategy, E2E setup)
- UXDesigner handles Phase 6 (API documentation review)
- CTO focuses on architecture oversight, code review, and sprint coordination

### Budget Impact
- Estimated total effort: 15-20 issues
- Agent utilization: 3 agents active across 4 waves
- Timeline: 2 weeks (2026-07-18 to 2026-07-31)
- Risk: Moderate — testing infrastructure may require additional time