# Post-GA Strategy — Nexus Engineering

**Status:** APPROVED — Board confirmed Hybrid A+B+C
**Last updated:** 2026-07-18 (Revision 2)
**Author:** CEO

## Context

Nexus Engineering declared GA on 2026-07-18 after 8 sprints. Platform MVP is feature-complete and deployed to Railway (`https://nexus-engineering-production.up.railway.app`). Pipeline is at absolute zero — 0/2 execution issues, all agents idle. Budget healthy at $8.04 / $500 (1.6%).

## Strategic Options

### Option A: Maintenance & Support (Steady State)

**Description:** Keep the platform in maintenance mode. Agents available for critical bugfixes, security patches, and dependency updates only. No new feature development.

**Cost:** ~$2-5/month (token budget)  
**Burndown:** ~0.5-1% of monthly budget  
**Team Impact:** All agents on retainer, low utilization  
**Revenue:** None (open-source/internal tool)  
**Risk:** Low — safe, conservative  
**Best for:** If the board wants to minimize spend and keep the platform stable

**Timeline:** Indefinite, review quarterly

---

### Option B: Enterprise Phase 2 (Authentication, RBAC, Multi-Tenant)

**Description:** Extend Nexus with enterprise features: authentication (Better Auth), organization management, role-based access control (RBAC), multi-tenant isolation, audit logging. Opens revenue path via self-hosted enterprise license or SaaS tiers.

**Cost:** ~$20-40/month (engineering burn)  
**Burndown:** ~4-8% of monthly budget  
**Team Impact:** Full reactivation of BackendArchitect + FrontendArchitect + UXDesigner  
**Revenue:** Potential (enterprise licensing/SaaS)  
**Risk:** Medium — clear market need, moderate engineering scope (~sprint 9-10)  
**Best for:** If the board wants to monetize the platform

**Timeline:** 2-3 sprints (30-45 days)

---

### Option C: AI Traceability Assistant (Ziel 6)

**Description:** Build the AI-powered traceability analysis features from VISION.md Ziel 6. Natural language querying of traceability graphs, impact analysis suggestions, coverage gap detection, automated trace link suggestions via LLM. Cutting-edge differentiator.

**Cost:** ~$40-60/month (engineering + LLM API costs)  
**Burndown:** ~8-12% of monthly budget  
**Team Impact:** Full team reactivation, requires AI/ML skills assessment  
**Revenue:** Indirect (platform differentiation)  
**Risk:** High — unproven demand, significant LLM API costs, complex scope  
**Best for:** If the board wants to push technological boundaries and differentiate

**Timeline:** 3-5 sprints (45-75 days)

---

### Option D: New Initiative (Pivot)

**Description:** Wind down Nexus active development. Reassign engineering team to a new strategic initiative (e.g., VeloSphere / The Bike App or another project). Nexus remains deployed but enters true maintenance-only (no agent time allocated).

**Cost:** $0/month (Nexus costs eliminated)  
**Burndown:** 0%  
**Team Impact:** Full team reassigned to new initiative  
**Revenue:** Depends on new initiative  
**Risk:** High switching cost — loses all Nexus platform momentum  
**Best for:** If the board has identified a more strategic opportunity

**Timeline:** Switch immediately upon board decision

---

## Board Decision: Hybrid A+B+C (Approved)

**Direction:** Board confirmed Hybrid A+B+C on 2026-07-18. Maintenance (A) runs as continuous background thread. Enterprise Phase 2 (B) executes as Sprint 9-10. AI Traceability (C) follows conditionally as Sprint 11-12.

**Secondary directive:** Establish "Engineering as Code" documents — requirements, architecture, functions, software described as code with issue traceability. This directly embodies the Nexus core thesis and serves as dogfooding for the platform.

---

## "Engineering as Code" Framework (Board Directive)

### Four-Tier Framework

#### Tier 1: Requirements as Code (RAC)
- **Location:** `/docs/requirements/` — structured YAML specs
- **Schema per requirement:** `id`, `title`, `description`, `sourceIssue` (THE-XXX), `acceptanceCriteria`, `status`
- **Two-way traceability:** Requirements ↔ Issues ↔ Code (via sourceIssue and git commit refs)
- **CI:** Validate format and issue references exist on PR

#### Tier 2: Architecture as Code (AAC)
- **Location:** `/docs/architecture/adr/` — ADRs as markdown with issue refs
- **Location:** `/docs/architecture/diagrams/` — C4 diagrams as PlantUML/Mermaid
- **Rule:** Every ADR links to the issue that triggered it
- **Rule:** Architecture changes require updated diagrams in the same PR

#### Tier 3: Specification as Code (SAC)
- **APIs:** OpenAPI 3.1 specs with `x-issue-id` extensions for traceability
- **Components:** Storybook stories (if frontend) linked to requirement IDs
- **Contracts:** Contract tests linked to spec files

#### Tier 4: Traceability as Code (TAC) — Nexus Dogfooding
- **Location:** `nexus.traceability.yaml` at repo root (auto-generated manifest)
- **Maps:** Issues → Requirements → ADRs → Code modules → Tests
- **Auto-generated via CI pipeline, human-curated annotations
- **Goal:** Nexus platform itself renders this traceability graph

### Phased Rollout

| Sprint | Focus | Deliverables |
|--------|-------|-------------|
| **Sprint 9** | RAC + AAC Foundations | Directory structure, templates, YAML schemas, first ADRs, CI validation |
| **Sprint 9-10** | SAC (alongside Enterprise Phase 2) | OpenAPI specs with issue links for new APIs, component specs |
| **Sprint 11+** | TAC Automation | Auto-generated traceability manifest, Nexus graph rendering |

---

## Execution Plan: Hybrid A+B+C

### Thread A: Maintenance (Continuous)
- Critical bugfixes, security patches, dependency updates only
- No new feature work under this thread
- Estimated cost: ~$2-5/month (token budget)
- All agents on retainer, low utilization

### Thread B: Enterprise Phase 2 (Sprint 9-10)
- **Sprint 9:** Authentication (Better Auth), RBAC, Organization management
- **Sprint 10:** Multi-tenant isolation, audit logging, Admin UI
- **Cost:** ~$20-40/month engineering burn
- **Team:** BackendArchitect + FrontendArchitect + UXDesigner

### Thread C: AI Traceability Assistant (Sprint 11-12, Conditional)
- Natural language querying of traceability graphs
- Impact analysis suggestions, coverage gap detection
- **Gate:** At least 1 enterprise pilot signed or strong adoption signal
- **Cost:** ~$40-60/month (engineering + LLM API)
- **Risk:** High — unproven demand, LLM API costs

---

## Board Decision Record

- [x] **Option A** — Maintenance mode. Approved as continuous background thread.
- [x] **Option B** — Enterprise Phase 2. Approved as Sprint 9-10.
- [x] **Option C** — AI Traceability Assistant. Approved as conditional Sprint 11-12.
- [ ] **Option D** — New initiative / pivot. Rejected.
- [x] **"Engineering as Code"** — Approved. Four-tier framework (RAC, AAC, SAC, TAC) per Sprint 9 rollout.
