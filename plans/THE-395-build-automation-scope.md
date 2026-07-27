# THE-395: Automated Local Build & Runtime Routine

**Status:** `blocked` 🔒
**Blocked Until:** Sprint 24 fully closed (THE-389→done, THE-380→done, THE-381→done)
**Delegation Target:** CTO (Sprint 25 W1)
**Priority:** P3 (process improvement)
**Strategic Fit:** ❌ (internal DevOps, not product feature)

## Original Requirement (from issue body)

Establish a **release-branch-based local build & runtime routine** so that at the end of every sprint, any team member can check out the stable reference branch and run the full application locally with a single command.

## Scope

### 1. Sprint-Branching Strategy
- After each sprint, create a protected release branch: `release/sprint-<N>` or `release/v<X.Y>`
- This branch is the immutable stable reference for demos, testing, and local documentation builds
- Document naming convention in `CONTRIBUTING.md`

### 2. Build & Runtime Automation
- Single command to build and run both backend + frontend locally
- Options: extend existing `docker-compose.yml` (THE-375) or create `scripts/run-local.sh`
- Must work on a fresh checkout of the release branch with `.env.example` — no manual code changes
- No hardcoded secrets (use `.env.example` pattern already established)

### 3. Local Service Topology
| Service | Port | Notes |
|---------|------|-------|
| Backend API | `localhost:8080` | Fastify/Express |
| Frontend | `localhost:443` | Next.js communicating with local backend |
| Database | Via docker-compose | Postgres |

### 4. Documentation
Create `RUN_LOCAL.md` (or extend `README.md`) covering:
1. `git checkout release/sprint-<N>` — switch to sprint branch
2. Copy `.env.example` → `.env`, fill secrets
3. Run single command to build + start all services
4. Verify backend healthcheck + frontend loads

### 5. Process Integration
- Add release branch creation + local build verification as fixed items in **Sprint Review Checklist**
- Document in `HEARTBEAT.md` or sprint close-out template

## DoD (from issue body)
- [ ] Branching process for sprint releases agreed and documented in repo
- [ ] Build script integrated and works from release branch checkout with zero manual code changes
- [ ] No hardcoded secrets/credentials (`.env.example` pattern)
- [ ] A non-developer team member (QA, PO, CEO) can check out the sprint branch and run the app locally following docs
- [ ] Release branch creation + local build execution are part of Sprint Review Checklist

## Existing Assets to Leverage
- `docker-compose.yml` (THE-375, commit `7456ed9`) — already has API + Frontend + Postgres services
- `Dockerfile.backend` (THE-375) — backend container build
- `.env.example` — already exists
- `scripts/` directory — existing validation scripts

## Budget Estimate
~$0.50-1.00 in token cost. Well under 10% of remaining runway (~$483).

## Unblock Condition
Sprint 24 fully closed → CTO available → delegate during Sprint 25 W1 (Integration Ecosystem Phase 1 has natural slack for process work).

