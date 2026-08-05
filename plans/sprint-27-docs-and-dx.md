# Sprint 27: Docs & Developer Experience (Phase 5, Sprint 2 of 3)

**Status:** ACTIVE — 2/5 waves done. W1 (API Docs) done, W2 (User Guide) in_review, W2g (UX Gate) in_progress, W3 (Quickstart) queued, W4 (E2E) blocked.
**Prerequisite:** Sprint 26 (THE-403) — GTM Content & Market Readiness must be fully closed.
**Parent Issue:** THE-409
**Budget:** Est. $4-7 (well under 10% runway gate of ~$48).

## Scope

### W1: API Reference Docs
- Auto-generate OpenAPI docs from route schemas
- Publish as static HTML page within app
- Include example requests/responses for all major endpoints

**Owner:** BackendArchitect
**Iteration Limit:** 6 calls

### W2: User Guide
- Walkthrough for requirements-as-code workflow
- Walkthrough for architecture-as-code workflow
- Walkthrough for test-as-code workflow
- Screenshots from Sprint 26 landing page

**Owner:** FrontendArchitect
**Iteration Limit:** 8 calls

### W2g: UX Gate — User Guide
- Gate review on user guide clarity and completeness
- Dependency: W2 must be `in_review`

**Owner:** UXDesigner
**Status:** `blocked` (per Gate Init Rule)

### W3: Quickstart & Example Repos
- Reduce quickstart to <5 commands
- Publish 2-3 example repos showing full traceability
- Link from README.md

**Owner:** FrontendArchitect (reassigned from CTO — CTO oversight-only per HB#334)
**Iteration Limit:** 6 calls
**Queued:** After THE-425 (W2 User Guide) completion

### W4: Sprint 27 E2E
- Full sprint verification

**Owner:** Senior QA
**Status:** `blocked` (on Sprint 27 completion)

## Sequencing
```
W1 (BA: API docs) ─────► W3 (CTO: Quickstart) ──► W4 (QA: E2E)
W2 (FA: User Guide) ──► W2g (UXD: Gate)
```

## DoD
- [ ] All auto-generated API docs published and accessible
- [ ] User guide covers all 3 workflows with screenshots
- [ ] Quickstart passes on clean clone
- [ ] At least 2 example repos published
- [ ] UX Gate approved on user guide
- [ ] Sprint E2E passes
- [ ] TSC clean
