# Sprint 28: Performance & Hardening (Phase 5, Sprint 3 of 3)

**Status:** PRE PLAN — Awaiting Sprint 27 completion.
**Prerequisite:** Sprint 27 (Docs & DX) must be fully closed.
**Budget:** Est. $6-10 (well under 10% runway gate of ~$48).

## Scope

### W1: Performance Audit
- Profile backend trace graph queries for large repos (10K+ files)
- Profile frontend bundle load and render times
- Identify top 3 performance bottlenecks
- Document findings in report

**Owner:** BackendArchitect
**Iteration Limit:** 6 calls

### W2: Caching Layer
- Add response caching for trace graph queries (most expensive operation)
- Implement ETag/If-None-Match for API responses
- Add CDN cache headers for static assets

**Owner:** BackendArchitect
**Iteration Limit:** 6 calls

### W3: Security Audit
- Verify RBAC enforcement across all routes
- Verify SAML token validation
- Audit self-hosted secrets management
- Fix any critical findings

**Owner:** CTO
**Iteration Limit:** 8 calls

### W4: Error Handling & Rate Limiting
- Ensure all API routes return consistent error shapes
- Verify rate limiter covers all public endpoints
- Add error boundary tests

**Owner:** FrontendArchitect
**Iteration Limit:** 6 calls

### W5: Sprint 28 E2E
- Full sprint verification
- Performance benchmark comparison (before/after)

**Owner:** Senior QA
**Status:** `blocked` (on Sprint 28 completion)

## Sequencing
```
W1 (BA: Audit) ──► W2 (BA: Caching) ──► W5 (QA: E2E)
W3 (CTO: Security) ─────────────────►
W4 (FA: Errors) ───────────────────►
```

## DoD
- [ ] Performance report with top 3 bottlenecks identified
- [ ] Caching layer reduces trace graph query time by >50%
- [ ] Security audit passes with 0 critical findings
- [ ] Consistent error shapes across all API routes
- [ ] Rate limiter covers all public endpoints
- [ ] Sprint E2E passes
- [ ] TSC clean
