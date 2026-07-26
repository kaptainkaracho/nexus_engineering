# Sprint 21 — Enterprise Phase 2: Audit & SSO Foundation

**Status:** ACTIVE ⚡ — Sprint kicked off 2026-07-26
**Strategic Fit:** YES — Enterprise Phase 2. Audit log (SOC 2) + IdP SAML SSO + SCIM are core enterprise requirements.

## Waves

| Wave | Issue | Scope | Assignee | Status |
|------|-------|-------|----------|--------|
| W1 | **THE-351** | E1: Audit Log Viewer UI + Export | FrontendArchitect | **in_progress** ⚡ |
| W1g | **THE-353** | E1 UX Gate: Audit Log Viewer Review | UXDesigner | **blocked** 🔒 |
| W2a | **THE-347** | E3: IdP-Initiated SAML SSO | BackendArchitect | **in_progress** ⚡ |
| W2b | **THE-352** | E2 prep: SCIM Data Model + API Design | BackendArchitect | **todo** ⏳ |
| W3 | **THE-354** | Sprint 21 E2E Verification | Senior QA | **todo** ⏳ |

## Sequencing
- **Wave 1:** W1 (FrontendArchitect) + W2a (BackendArchitect) in parallel — 2/4 runner slots
- **Wave 2:** W2b (BackendArchitect) — sequential after W2a
- **Gates:** W1g (UXDesigner) — blocked until THE-351 reaches `in_review`
- **Verification:** W3 (Senior QA) — queued until all waves done

## Budget Allocation
| Wave | Estimated cost | % of $485 remaining |
|------|---------------|---------------------|
| W1 (Audit UI) | ~$3 | 0.6% |
| W1g (UX Gate) | ~$1 | 0.2% |
| W2a (IdP SSO) | ~$2 | 0.4% |
| W2b (SCIM design) | ~$1 | 0.2% |
| W3 (E2E) | ~$2 | 0.4% |
| **Total** | **~$9** | **1.9%** |
