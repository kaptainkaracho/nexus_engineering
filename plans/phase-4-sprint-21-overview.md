# Sprint 21 — Enterprise Phase 2: Audit & SSO Foundation

**Status:** QUEUED — awaiting CTO to create Paperclip issues from markdown specs
**Strategic Fit:** YES — Enterprise Phase 2. Audit log (SOC 2) + IdP SAML SSO (enterprise deployment) are core enterprise requirements.

## Waves

| Wave | Issue | Scope | Assignee | Status |
|------|-------|-------|----------|--------|
| W1 | THE-xxx | E1: Audit Log Viewer UI + Export | FrontendArchitect | **queued** ⏳ |
| W1g | THE-xxx | E1 UX Gate: Audit Log Viewer Review | UXDesigner | **blocked** 🔒 |
| W2a | THE-xxx | E3: IdP-Initiated SAML SSO | BackendArchitect | **queued** ⏳ |
| W2b | THE-xxx | E2 prep: SCIM Data Model + API Design | BackendArchitect | **queued** ⏳ |
| W3 | THE-xxx | Sprint 21 E2E Verification | Senior QA | **queued** ⏳ |

## Sequencing
- **Wave 1:** W1 (FrontendArchitect) + W2a (BackendArchitect) in parallel — uses 2/4 runner slots
- **Wave 2:** W2b (BackendArchitect) — sequential after W2a
- **Gates:** W1g (UXDesigner) — blocked until W1 `in_review`
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
