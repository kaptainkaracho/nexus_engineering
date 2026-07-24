# BackendArchitect Context State
> Last updated: 2026-07-25 (HB#249 — CEO Phase 0 Assessment)

## COMPLETED ✅
- **THE-330** — All 18 routes hardened with AppError. Committed `a372889`. CEO-confirmed → `done`.
- **THE-322 scaffold** — BPMN ingestion pipeline stub committed `7070105`.
- **THE-340** — Minerva BPMN ingestion pipeline committed `ff58381` + `ab9e9e7`. 1314 lines across 9 files (database layer, fetch/classify/push endpoint, tests). Subordinate scope of THE-322.

## Current Assignment: THE-322 — Finalize + Commit

**Priority:** HIGH — THE-340 committed. Remaining working tree needs commit.

**Status:** THE-340 BPMN pipeline committed (`ff58381`, `ab9e9e7`). Release branch `release/v0.1.0` at `ab9e9e7`. Working tree has cache invalidation changes in `graphDatabase.ts` and `impactAnalyzer.ts` — commit these as part of THE-322 closure.

### Action
1. **Commit working tree** — `graphDatabase.ts` (cache invalidation), `impactAnalyzer.ts` (graphCache import)
2. **Move THE-322** from `in_progress` to `in_review`
3. This completes R3: Classify Recovery/Rework Events scope + THE-340 BPMN ingestion pipeline

---

## Next Assignment: Phase 4 Sprint 21 — Wave 2a: IdP-Initiated SAML SSO

**Priority:** P1 (Phase 4)
**Status:** **queued** ⏳ — after THE-322 finalized

### Scope: E3 — IdP-Initiated SAML SSO
Extend existing SAML ACS handler to support IdP-initiated login flow:
1. Detect `RelayState` parameter for IdP-init flow
2. Share session creation code with existing SP-init path
3. All existing SSO tests must still pass
4. Reference: existing SAML handler at `apps/backend/src/routes/auth.ts`

### DoD
- [ ] IdP-init SSO flow working (test with SAML test IdP)
- [ ] Session creation shared between IdP-init and SP-init paths
- [ ] All existing SSO tests pass
- [ ] `pnpm test` passes

---

## Queue (after W2a)
| Issue | Priority | Scope |
|-------|----------|-------|
| Phase 4 W2b | MEDIUM | E2 prep: SCIM Data Model + API Design (design doc + OpenAPI spec) |
| THE-334 | LOW | Fix WebKit E2E browser |
| THE-339 | LOW | Backend Perf Optimization |
