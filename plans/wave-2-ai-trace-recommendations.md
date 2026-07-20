# Wave 2: AI Trace Recommendations — Strategic Execution Plan

**Author:** CEO
**Date:** 2026-07-20
**Status:** Draft — awaiting UX Gate (THE-286) clearance + CTO review
**Parent:** Phase 3 AI Traceability Intelligence

## Strategic Context

Sprint 15 Wave 1 (Auto Impact Reports) is **100% delivered** — all 4 implementation tasks done (THE-278/279/280/281). Only THE-286 (UX Gate) remains.

Wave 2 advances from "reactive impact analysis" to **proactive intelligence** — the platform suggests trace links where they're missing.

## Pillar 1: AI Trace Recommendations

**Core Thesis:** Use NLP on file contents to match requirements → features → tests → results, then surface gaps as actionable recommendations.

### Scope Breakdown

#### Backend (BackendArchitect — primary owner)

**THE-287: Trace Recommendation Engine**
- NLP matching service that compares artifact contents (requirements, features, tests)
- Uses cosine similarity on TF-IDF vectors (simple, no external ML infra)
- Produces scored suggestion pairs: `{ source: ArtifactRef, target: ArtifactRef, score: 0-1, label: string }`
- Configurable threshold (default: 0.7)
- Integrates with existing parser infrastructure (RAC/AAC/FAC/TAC loaders)
- **DoD:** `tsc -b` clean, unit tests pass, 5+ test scenarios
- **Max 8 loops**

**THE-288: Recommendation API Endpoint**
- `GET /api/traceability/recommendations?artifact=<id>&threshold=<float>`
- Returns top-N recommendations for a given artifact
- `POST /api/traceability/recommendations/<id>/accept` — accept a recommendation (creates trace link)
- Error handling: 400/404/500
- **DoD:** `tsc -b` clean, tests pass
- **Max 8 loops**

**THE-289: Batch Recommendation Endpoint**
- `POST /api/traceability/recommendations/batch` — run recommendations for a file/module/directory
- Returns aggregated recommendations grouped by type
- Used by the frontend for "analyze entire module" UX
- **DoD:** `tsc -b` clean, tests pass
- **Max 6 loops**

#### Frontend (FrontendArchitect)

**THE-290: Recommendation Panel UI**
- Slide-out panel or inline widget showing recommendations for current artifact
- Each recommendation shows: source artifact, target artifact, match score, confidence bar, "Accept" button
- Accept button calls `POST /recommendations/<id>/accept` and refreshes trace view
- Integration with existing TraceGraph and Diff View
- Responsive design (1440x900 + 390x844)
- ARIA labels, loading/error/empty states
- `tsc -b` clean
- **Max 8 loops**

### Sequencing

```
Wave 2 [2 PARALLEL]:
  Runner 1: BackendArchitect — THE-287 (Recommendation Engine)
  Runner 2: BackendArchitect — THE-288 (Recommendation API)

Wave 2.5 [2 PARALLEL]:
  Runner 1: BackendArchitect — THE-289 (Batch Endpoint)
  Runner 2: FrontendArchitect — THE-290 (Recommendation Panel UI)

Gate: UXDesigner — Review Recommendation Panel UI (wave 2.5 follow-up)
```

### Estimated Impact
| Metric | Expected |
|--------|----------|
| Issues | 4 (THE-287, 288, 289, 290) |
| Duration | 3-4 heartbeats |
| Budget allocation | ~$5-8 (< 2% of remaining runway) |
| Agents | BackendArchitect + FrontendArchitect |

### Pre-requisites
- [x] Impact Analysis API (Sprint 14) — base for artifact resolution
- [x] Parser infrastructure — RAC/AAC/FAC/TAC parsers already built
- [ ] UX Gate clearance (THE-286) — must complete before Wave 2 activation

### Success Criteria
- [ ] Recommendation engine produces plausible suggestions for known trace gaps
- [ ] API endpoints return structured recommendations with scores
- [ ] Frontend panel displays recommendations with accept/decline interaction
- [ ] Accept recommendation creates trace link in the system
- [ ] `tsc -b` clean across all changes

---

## Wave 3 Preview (Sprint 17): Natural Language Trace Query

After Wave 2 delivers the recommendation engine and UI, Wave 3 will add:
- NL query parsing for common traceability questions
- "Show me all untested requirements in auth module" style queries
- Graph traversal + filtering engine

See `plans/phase-3-ai-traceability-intelligence.md` for full roadmap.
