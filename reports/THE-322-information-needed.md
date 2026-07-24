# THE-322 — Required Information for Recovery/Rework Classification

**Question from board:** Welche Informationen werden benötigt, um die Aufgabe korrekt auszuführen?

---

## Current State

### What exists in Nexus (completed):
- `apps/backend/src/services/recoveryReworkClassifier.ts` — Classification engine with 6 rules:
  - **RC-R1:** Recovery via status transition (blocked → in_progress)
  - **RC-R2:** Recovery via resume after pause
  - **RC-W1:** Rework via retry after failure
  - **RC-W2:** Rework via repeated runs on same issue (threshold-based)
  - **RC-I1:** Intervention via pause/resume cycle
- `apps/backend/src/routes/recoveryRework.ts` — 2 API endpoints
  - `POST /api/recovery-rework/classify` — Classify runs
  - `POST /api/recovery-rework/enrich` — Produce Minerva-compatible events
- `apps/backend/src/services/recoveryReworkClassifier.test.ts` — 13 tests, all passing
- Routes registered in `index.ts`

### What exists in Minerva (gap):
- 2,088 process events with `recovery_type: null` for ALL events
- 492 failed runs with no rework/recovery classification
- BPMN classifier has no rules for recovery/rework patterns
- No API endpoint to update events or configure classification rules
- `POST /heartbeat-runs` exists (create only) — no GET, no PATCH
- `POST /process-mining/ingest-transcript` — no schema defined

---

## Information Needed

### 1. Minerva Source Code Access
**Why:** The BPMN classification rules and processEventsEtl live in the Minerva Python service. To add recovery/rework detection, I need to either:
- Modify the Python classifier directly, OR
- Add a post-processing step after ETL

**What specifically:**
- Path to the BPMN classifier module (likely `minerva/process_mining/bpmn/`)
- Path to the processEventsEtl module
- The database schema for the events table (to confirm `recovery_type` column)

### 2. Paperclip Run Data Schema
**Why:** The classifier needs `previousStatus` and `wasPaused` fields, which may not be in the current Paperclip run model.

**What specifically:**
- Does Paperclip store run status history (not just current status)?
- Is there a `paused` / `resumed` event type in the heartbeat run lifecycle?
- What fields are available on `HeartbeatRunCreate` beyond what's in the OpenAPI schema?

### 3. Integration Point Decision
**Why:** There are three possible integration points — the board/CTO needs to choose:

| Option | Pros | Cons |
|--------|------|------|
| **A. Modify Minerva classifier** | Direct fix, all data available | Requires Minerva source access |
| **B. Nexus webhook enrichment** | Uses existing Nexus API | Requires Minerva to call Nexus |
| **C. Batch DB update script** | One-time fix for 492 runs | Doesn't help future runs |

**Recommendation:** Option A (modify Minerva classifier) is the only sustainable path. Options B and C are stopgaps.

### 4. Acceptance Criteria
**Why:** The original issue has no explicit AC. I need clarity on:

- [ ] Should recovery/rework events appear in BPMN process types?
- [ ] Should the recovery/rework rate be added to the KPIs endpoint?
- [ ] Should the 492 existing failed runs be retroactively classified?
- [ ] What is the expected recovery/rework rate after classification?

---

## Deliverables Ready for Handoff

| File | Status | Tests |
|------|--------|-------|
| `recoveryReworkClassifier.ts` | ✅ Complete | 13/13 passing |
| `recoveryRework.ts` | ✅ Complete | Route registered |
| `recoveryReworkClassifier.test.ts` | ✅ Complete | All green |
| `index.ts` (route registration) | ✅ Complete | — |

---

## Blockers

1. **Minerva source code access** — Cannot modify BPMN classifier without it
2. **No event update API** — Minerva has no PATCH/PUT endpoint for process events
3. **No run history data** — Paperclip runs don't expose `previousStatus` or `wasPaused`

---

**@CTO:** Which of the above information items can you provide? Specifically:
1. Can I get read access to the Minerva Python codebase?
2. Is there a `process_events` table migration I can inspect?
3. Does Paperclip track run status transitions?
