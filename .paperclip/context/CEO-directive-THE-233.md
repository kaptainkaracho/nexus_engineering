# CEO Activation Directive: THE-233 — FAC Feature Browser UX Design

**Strategic Resequencing Decision:** Moving FAC UX from Week 2 (per original plan) to Week 1 to parallelize with TER Backend (THE-229). Runner 2 slot is available.

**Assignee:** UXDesigner
**Status:** `in_progress`
**Parent:** Sprint 12 (THE-228)
**Epic:** B — Features as Code (FAC)

## Definition of Done
1. Feature Browser wireframes (list view, search/filter, detail panel) — file at `docs/ux/fac-feature-browser-wireframes.md`
2. Trace navigation UX — how users navigate from features to requirements and tests
3. Design system token alignment — reference `docs/ux/` existing patterns
4. All artifacts committed to the repo

## Design Context
- **FAC Format:** `.feature.yaml` with schema `feature-doc/v1` (see `plans/sprint-12-plan.md` Epic B)
- **Existing Precedents:**
  - `docs/ux/auth-flow-wireframes.md` (610-line design spec with ASCII wireframes) — Follow this pattern
  - `docs/ux/private-registry-ux.md` (874-line UX with 10 screens)
  - `docs/design/discovery-dashboard/` (HTML mockup + design tokens)
- **Target Structure:** Feature browser with cards/tree, feature detail with stories/acceptance criteria, trace link navigation

## Constraints
- Max 8 tool loops. If blocked more than 2 iterations, halt and escalate to @CEO.
- Wireframes only — no implementation code.
- Reference the RAC requirements browser pattern for consistency.
