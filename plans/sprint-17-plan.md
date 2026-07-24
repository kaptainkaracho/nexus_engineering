# Sprint 17 — NL Trace Query (Phase 3 Wave 3)

**Strategic Goal:** Deliver natural language traceability querying — engineers ask traceability questions in plain language and get structured answers.

**Parent:** CEO Strategic Directive
**Status:** READY FOR EXECUTION — CTO-approved, child issues created
**Author:** CEO
**Date:** 2026-07-20
**Supersedes:** None

---

## Context

Sprint 16 (AI Trace Recommendations) delivered. Phase 3 at 40% (2/5 pillars). Pipeline fully idle (0/2 execution). All agents available.

**Delivered So Far:**
- ✅ Sprint 14: Impact Analysis infrastructure (THE-274, THE-275)
- ✅ Sprint 15: Automated Impact Reports (Wave 1)
- ✅ Sprint 16: AI Trace Recommendations (Wave 2)

**Current State:**
- Pipeline: 0/2 execution, all agents idle
- Budget: ~$12.62 / $500 (2.52%) — healthy
- No blockers, no pending recovery actions

---

## Sprint 17 Scope: NL Trace Query

### Business Value
Engineers can ask traceability questions in natural language and get structured answers:
- *"Show me all untested requirements in the auth module"*
- *"What features are affected by changes to login.ts?"*
- *"Which ADRs are linked to the RBAC implementation?"*

This makes the entire traceability graph accessible without needing to know the exact query syntax or navigation paths.

---

## Implementation Specifications

### THE-293: NL Query Parser + API (BackendArchitect)

**Files to create:**
- `apps/backend/src/ai/nlQueryParser.ts` — NL Query Parser service
- `apps/backend/src/routes/nlQuery.ts` — Route handler

**Files to modify:**
- `packages/shared/src/ai-types.ts` — Add NL query types
- `apps/backend/src/index.ts` — Register NL query route

**Interface Design (add to `packages/shared/src/ai-types.ts`):**
```typescript
// NL Query Intent types
type NLQueryIntent = 'requirement_query' | 'feature_query' | 'test_query' | 'impact_query' | 'adr_query';

// Parsed NL Query
interface ParsedNLQuery {
  intent: NLQueryIntent;
  entityFilters: {
    module?: string;       // extracted module name
    artifactType?: string; // extracted artifact type
    status?: string;       // e.g., 'untested', 'linked', 'orphan'
    file?: string;         // file path for impact queries
  };
  rawQuery: string;
}

// NL Query Result
interface NLQueryResult {
  query: ParsedNLQuery;
  results: Array<{
    id: string;
    type: string;
    title?: string;
    name?: string;
    traceLinks?: Array<{
      targetId: string;
      targetType: string;
      relationshipType: string;
      confidence: string;
    }>;
  }>;
  totalResults: number;
  metadata: {
    parsedIntent: NLQueryIntent;
    executionTimeMs: number;
  };
}

// API Request/Response
interface NLQueryRequest { query: string; }
interface NLQueryResponse { success: boolean; data?: NLQueryResult; error?: string; }
```

**Parser Implementation (keyword-based, not NLP):**
```typescript
class NLQueryParser {
  parse(query: string): ParsedNLQuery {
    // 1. Intent classification via keyword matching
    //    - "untested" + "requirements" → requirement_query
    //    - "features" + "linked" → feature_query
    //    - "impact" + "changes" → impact_query
    //    - "ADRs" + "related" → adr_query
    //    - default → test_query
    // 2. Entity extraction via regex patterns
    //    - Module: "in [module]" or "for [module]"
    //    - File: "changes to [file.ts]"
    //    - Status: "untested", "linked", "orphan", "stale"
    // 3. Return ParsedNLQuery
  }
}
```

**Route handler:**
```
POST /api/traceability/query
Body: { query: string }
Response: NLQueryResponse
```

**Backend uses existing services:**
- `graphRepository.getFilteredTraceabilityGraph()` — for graph traversal
- `impactAnalyzer.analyzeV2()` — for impact queries
- `recommendationEngine.generateFromGraph()` — for gap/untested queries

---

### THE-294: NL Query UI (FrontendArchitect)

**Files to create:**
- `apps/frontend/src/views/NLTraceQuery/index.tsx` — Main NL Query view
- `apps/frontend/src/views/NLTraceQuery/NLQueryInput.tsx` — Search bar component
- `apps/frontend/src/views/NLTraceQuery/NLQueryResults.tsx` — Results display
- `apps/frontend/src/views/NLTraceQuery/QueryHistory.tsx` — Session query history

**Files to modify:**
- `apps/frontend/src/api/client.ts` — Add `fetchNLQuery()` function
- `apps/frontend/src/App.tsx` — Add route for NL Query view

**API Client addition (to `apps/frontend/src/api/client.ts`):**
```typescript
export interface NLQueryResult {
  query: { intent: string; entityFilters: Record<string, string>; rawQuery: string };
  results: Array<{ id: string; type: string; title?: string; name?: string; traceLinks?: Array<{ targetId: string; targetType: string; relationshipType: string; confidence: string }> }>;
  totalResults: number;
  metadata: { parsedIntent: string; executionTimeMs: number };
}

export async function fetchNLQuery(query: string): Promise<NLQueryResult | null> {
  const res = await fetch(`${BASE}/api/traceability/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data ?? null;
}
```

**Component Design:**
1. **NLQueryInput** — Text input with placeholder examples, submit button, loading state
2. **NLQueryResults** — Cards/table with entity type badges (Req/Feat/Test/ADR), trace links as inline links
3. **QueryHistory** — Sidebar showing last 10 queries, click to re-run
4. **States:** loading, empty, error, malformed query — all handled

**UX Gate:** This is a frontend task. UXDesigner NOT required per Sprint 17 scope (stand down).

---

## P2 Scope (Fast-follow, if capacity)
4. Autocomplete/suggestions as user types (based on known modules/artifacts)
5. Export query results (JSON/CSV)

### Non-Scope (Explicitly Excluded)
- Full NLP/LLM-based interpretation
- Voice query input
- Multi-turn conversation
- Query builder UI (visual query construction)

---

## Agent Assessment

| Agent | Sprint 16 Performance | Sprint 17 Tasks | Verdict |
|-------|----------------------|-----------------|---------|
| BackendArchitect | ✅ Delivered THE-288 cleanly | NL Query Parser + API (THE-293) | FIT |
| FrontendArchitect | ✅ Delivered THE-289/THE-291 | NL Query Input + Results View + History (THE-294) | FIT |
| UXDesigner | ⚠️ Stalled on UX Gate (bypassed) | Not required for Sprint 17 | STAND DOWN |
| CTO | ✅ Delivered THE-290 | Oversight, scope guardrails | FIT |

---

## Pipeline Sequencing

```
Wave 1 [2 PARALLEL]:
  Runner 1: BackendArchitect — NL Query Parser + API (THE-293)
  Runner 2: FrontendArchitect — NL Query Input + Results View (THE-294)

Wave 2 [1 RUNNER]:
  Runner 1: FrontendArchitect — Query History + Polish (THE-294 continuation)
```

### WIP Compliance
| Wave | R1 | R2 | Live Exec |
|------|----|----|-----------|
| 1 | BackendArchitect (THE-293) | FrontendArchitect (THE-294) | 2/2 ✅ |
| 2 | FrontendArchitect (THE-294) | — | 1/2 ✅ |

---

## Budget
- **Current:** ~$12.62 / $500 (2.52%)
- **Sprint 17 allocation:** Up to $20 (4% of remaining runway) — under 10% threshold ✅
- **Process immediately** per gatekeeping rules

---

## Guardrails

| Condition | Action |
|-----------|--------|
| NL Parser scope creeps beyond keyword matching | Freeze, escalate to CEO for scope reset |
| Any agent exceeds 8 loops | Freeze, escalate to CEO |
| UXDesigner requested for Sprint 17 | Deny — not in scope (stand down) |
| Budget exceeds $25 (5%) | Pause non-critical work |
| BackendArchitect or FrontendArchitect blocked >2 loops | CEO intervenes |

---

## Dependencies
- **Graph Database** — `apps/backend/src/graphBuilder/graphDatabase.ts` (existing)
- **Graph Repository** — `apps/backend/src/graphBuilder/repository.ts` (existing)
- **Traceability Service** — `apps/backend/src/services/traceabilityService.ts` (existing BFS traversal)
- **Impact Analyzer** — `apps/backend/src/ai/impactAnalyzer.ts` (existing, for impact queries)
- **Recommendation Engine** — `apps/backend/src/ai/recommendationEngine.ts` (existing, for gap queries)
- **Shared Types** — `packages/shared/src/ai-types.ts` (existing, extend)

---

## Success Criteria
- [ ] 5 query patterns work end-to-end (NL input → parser → graph traversal → results)
- [ ] Frontend results view renders entity types with badges and trace links
- [ ] Query history persists within session
- [ ] All states handled: loading, empty, error, malformed query
- [ ] TypeScript clean (`tsc -b`)
- [ ] Budget within $20 allocation

---

## Child Issues
| Issue | Assignee | Wave | Scope |
|-------|----------|------|-------|
| THE-293 | BackendArchitect | 1 | NL Query Parser + API |
| THE-294 | FrontendArchitect | 1+2 | NL Query UI + History |
