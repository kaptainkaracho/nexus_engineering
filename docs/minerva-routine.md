# Minerva Agent Routine — Standard Operating Procedure

**Version:** 1.0.0
**Applies to:** Minerva (Process Intelligence Expert)
**Frequency:** Per sprint / on-demand

---

## 1. Pre-Analysis Checklist

Before running any analysis, verify these prerequisites:

### 1.1 MCP Server Reachable

```bash
curl -s http://localhost:8002/health
# Expected: {"status":"ok","version":"0.22.0",...}
```

If unreachable, check:
- Minerva service is running: `systemctl status minerva` or `docker ps`
- Port 8002 is not blocked
- Database is connected (health endpoint returns DB status)

### 1.2 All 11 Tools Available

```bash
MINERVA_API_KEY=<key> opencode mcp list
# Expected: ● ✓ minerva  connected  http://localhost:8002/mcp
# Tools: 11/11
```

Expected tools:
| Tool | Purpose |
|------|---------|
| `get_process_evidence` | Retrieve process evidence for a case/run |
| `compare_processes` | Compare two processes |
| `get_gold_standard` | Fetch the reference/gold-standard process model |
| `get_variants` | List process variants |
| `get_quality_scores` | Process quality scores |
| `get_quality_trends` | Quality trends over time |
| `get_recommendations` | Improvement recommendations |
| `create_optimization_plan` | Draft an optimization plan |
| `record_action` | Record a process action taken |
| `record_impact` | Record measured impact of an action |
| `get_action_history` | History of recorded actions/impacts |

### 1.3 Data Ingestion Verified

```bash
# Set auth
API_KEY="<MINERVA_API_KEY>"
TENANT="the_software_company"

# Check events ingested
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/events?limit=1"
# Expected: response with events array, total > 0

# Check Paperclip poller activity
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/stats/dashboard"
```

If events are empty:
- Check Paperclip poller is running
- Trigger manual ingestion via `POST /process-mining/ingest-transcript`
- Or wait for next poll cycle

---

## 2. Triggering BPMN Classification

BPMN classification converts raw tool-call events into classified process activities.

### 2.1 Fetch Events as Tool Calls

Retrieve events from the database to build the classification payload:

```python
# Pseudocode — implement in Minerva poller or manual script
events = GET /process-mining/events?limit=200
tool_calls = map events to {case_id, activity, timestamp, resource, tool, ...}
```

### 2.2 Send Classification Request

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  -H "Content-Type: application/json" \
  "http://localhost:8002/process-mining/bpmn/classify" \
  -d '{"tool_calls": [...]}'
```

Expected response:
```json
{
  "runId": "<run_uuid>",
  "classifications": [...]
}
```

### 2.3 Verify Classification

```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/bpmn/classifications"
# Expected: total > 0, classifications array with run_id entries
```

---

## 3. Running Analysis

### 3.1 Process Discovery

Discovers BPMN process models from classified events:

```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/bpmn/discover"
# Expected: process object with tasks and lanes
```

Additional discovery endpoints:
- Process types: `GET /process-mining/bpmn/process-types`
- Process map: `GET /process-mining/bpmn/process-map`

### 3.2 Compute Benchmarks

Establishes baseline quality scores from historical data:

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  -H "Content-Type: application/json" \
  "http://localhost:8002/process-mining/benchmarks/compute" \
  -d '{}'
# Expected: {"stored": <count>, "benchmarks": [...]}
```

Verify benchmarks:
```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/benchmarks"
```

### 3.3 Quality Scores

```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/kpis"
# Expected: KPIs including cycle_time, token_consumption, cost metrics
```

Quality trend data:
```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/evidence/quality/trend"
```

### 3.4 Process Evidence Retrieval

```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/evidence"
# Expected: evidence array with per-run records
```

Evidence variants:
```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/evidence/variants"
```

Evidence health:
```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/evidence/quality/health"
```

### 3.5 Recommendations (Optimization Suggestions)

```bash
curl -s -H "Authorization: Bearer ${API_KEY}" \
  -H "X-Tenant-Id: ${TENANT}" \
  "http://localhost:8002/process-mining/optimizations"
# Expected: suggestions array with bottleneck and optimization info
```

### 3.6 Additional Analysis Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /process-mining/variants` | Process variant analysis |
| `GET /process-mining/bottlenecks` | Bottleneck detection |
| `GET /process-mining/cycle-time` | Cycle time statistics |
| `GET /process-mining/resources` | Resource workload analysis |
| `GET /process-mining/resources/handoffs` | Agent handoff analysis |
| `GET /process-mining/resources/utilization` | Resource utilization |
| `GET /process-mining/kpis/trends` | KPI trends over time |
| `GET /process-mining/kpis/collaboration` | Collaboration KPIs |
| `GET /process-mining/predictions/warnings` | Early warnings |
| `GET /process-mining/predictions/next-events` | Predicted next events |
| `GET /process-mining/predictions/trends` | Trend analysis |
| `GET /process-mining/signals` | Tenant signals list |
| `GET /process-mining/collaboration/issues` | Collaboration issues |
| `GET /process-mining/collaboration/summary` | Collaboration summary |
| `GET /process-mining/processes/similarities` | Process similarities |

---

## 4. Generating and Interpreting Reports

### 4.1 Report Structure

A standard Minerva quality report includes:

1. **Connection Status** — MCP server, tools, database connectivity
2. **Quality Scores per Dimension** — Efficiency, Reliability, Cost, Structure, Completeness
3. **Evidence Summary** — Timeline, anomalies, agent productivity
4. **Recommendations** — Prioritized improvement suggestions

### 4.2 Data Sources for Report

| Report Section | API Endpoint |
|---------------|-------------|
| Quality Scores | `GET /process-mining/kpis` |
| Evidence Timeline | `GET /evidence` |
| Agent Productivity | `GET /process-mining/agents/profiles` |
| Bottlenecks/Anomalies | `GET /process-mining/bottlenecks` |
| Recommendations | `GET /process-mining/optimizations` |
| Cycle Times | `GET /process-mining/cycle-time` |
| Variants | `GET /process-mining/variants` |

### 4.3 Interpreting Scores

Scores are normalized 0–100:

| Range | Meaning |
|-------|---------|
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Fair — needs attention |
| <60 | Poor — requires intervention |

### 4.4 Interpreting Evidence

Evidence records contain:
- `run_id` — Links to Paperclip run
- `agent_ids` — Agents involved
- `tool_call_count` — Number of tool calls
- `handoff_count` — Number of agent handoffs
- `cost_summary` — Cost breakdown
- `anomalies` — Detected anomalies

### 4.5 Interpreting Recommendations

Recommendations include:
- `type` — Category (bottleneck_reduction, optimization, etc.)
- `title` — Human-readable summary
- `description` — Detailed explanation
- `potential_impact` — high/medium/low
- `estimated_savings_ms` — Estimated time savings

---

## 5. Post-Analysis Cleanup

### 5.1 Archive Report

Save the generated report to `reports/` with naming convention:
```
reports/sprint-<N>-process-quality.md
```

### 5.2 Update Sprint Evidence

Populate `docs/minerva/sprint-evidence-template.yaml` with data from this sprint.

### 5.3 Verify Tools Still Respond

```bash
MINERVA_API_KEY=<key> opencode mcp list
# Confirm 11 tools still connected
```

### 5.4 Log Run

Record analysis execution:
- Date/time of analysis
- Sprint ID analyzed
- Data sources used
- Any issues encountered
- Quality score result

### 5.5 Recommendation-to-Issue Pipeline

Jede Recommendation aus dem Report MUSS als eigenes Issue im Backlog dokumentiert werden, damit Erkenntnisse nicht verpuffen.

#### 5.5.1 Issues Erstellen

Für jede Recommendation (R1, R2, ...) ein child issue anlegen:

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:3100/api/issues" \
  -d '{
    "projectId": "<PROJEKT_ID>",
    "title": "<Titel der Recommendation>",
    "description": "**Finding:** ...\n**Action:** ...\n**Expected Impact:** ...\n**Source:** Sprint <N> Minerva Report",
    "parentId": "<ID_des_Routine_Issues>",
    "status": "backlog",
    "assigneeAgentId": "<AGENT_ID_laut_Recommendation>",
    "priority": "<high/medium/low>"
  }'
# Expected: 201 Created mit Issue-ID
```

**Pflichtfelder:**
| Feld | Wert |
|------|------|
| `projectId` | Aus dem Routine-Kontext (gleiches Projekt wie das Routine-Issue) |
| `title` | Prägnanter Titel (z.B. "Filter Infrastructure Noise from Process Mining") |
| `description` | Finding + Action + Impact aus dem Report |
| `parentId` | ID des aktuellen Routine-Issues (damit Nachverfolgung möglich) |
| `status` | `backlog` |
| `assigneeAgentId` | UUID des verantwortlichen Agenten (laut Recommendation: CTO, CEO, etc.) |
| `priority` | Aus dem Report (high/medium/low) |

#### 5.5.2 Report mit Issue-Referenzen Aktualisieren

Nach der Issue-Erstellung den Report aktualisieren:

```markdown
| Recommendation | Issue | Assignee | Status |
|---------------|-------|----------|--------|
| R1: ... | [THE-XXX] | @CTO | backlog |
| R2: ... | [THE-YYY] | @CEO | backlog |
```

#### 5.5.3 CEO-Delegation Einleiten

Nach der Issue-Erstellung das Routine-Issue an den CEO reassignen:

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:3100/api/issues/<ROUTINE_ISSUE_ID>" \
  -d '{
    "assigneeAgentId": "<CEO_AGENT_ID>"
  }'
```

Dann Kommentar posten (Achtung: das erzeugt einen neuen Kommentar, aber das Issue ist `in_progress`, kein `done`, daher kein Reopen-Problem):

> **Recommendation-to-Issue Pipeline abgeschlossen.**
>
> N child issues mit `status: backlog` erstellt und mit dem Routine-Issue verknüpft:
> - [THE-XXX](<url>) – Titel Recommendation 1
> - [THE-YYY](<url>) – Titel Recommendation 2
>
> @CEO Bitte reviewen, priorisieren und delegieren. Setze dazu die Issues auf `status: todo` und weise sie den entsprechenden Agenten zu. Erst danach dieses Issue auf `done` setzen.

#### 5.5.4 Abschluss durch CEO

CEO prüft die Backlog-Issues:
1. **Reviewen** – Ist die Recommendation valide?
2. **Priorisieren** – `status` von `backlog` auf `todo` setzen
3. **Delegieren** – `assignee` bestätigen/nachbessern
4. **Routine-Issue schließen** – via PATCH ohne Kommentar (verhindert Reopen-Loop)

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:3100/api/issues/<ROUTINE_ISSUE_ID>" \
  -d '{
    "status": "done",
    "completedAt": "<ISO_TIMESTAMP>"
  }'
```

---

## 6. Routine Maintenance & Sustainability

This section documents how to keep the Minerva routine itself healthy and sustainable.

### 6.1 Routine Configuration Audit

Every 3 sprints (or when routine behavior changes), verify:

| Check | Expected | How to Verify |
|-------|----------|---------------|
| **Cron Schedule** | `0 16 * * 5` (Fri 16:00 UTC) | Fetch routine: `GET /api/routines/{id}` → check `originKind` is not `manual` |
| **Concurrency Policy** | `coalesce_if_active` | Same endpoint → prevents duplicate runs |
| **Catch-up Policy** | `skip_missed` | Same endpoint → skips missed triggers |
| **Assignee** | Minerva agent | Same endpoint → `assigneeAgentId` matches Minerva |
| **Run History** | Last run completed | `GET /api/routines/{id}/runs` → check last run `status` |

If cron schedule is missing (routine shows `originKind: manual`):
1. Create CTO issue to configure schedule via routine triggers API
2. Update routine description to reflect actual schedule state

### 6.2 Issue Output Audit

Each routine execution creates a new issue. After each sprint, verify:

| Check | Action if Failing |
|-------|-------------------|
| Issue was created | Check routine ran successfully |
| All recommendations turned into child issues | Siehe Section 5.5 — jede Recommendation braucht ein child issue im Backlog |
| CEO has reviewed and delegated | Issue bleibt `in_progress` bis CEO Delegation bestätigt |
| Issue is properly closed | Close with `PATCH /api/issues/{id}` → `status: done, completedAt: <now>` |
| Issue has no stale reopen loops | **Do not post closing comments** — they trigger `issue_reopened_via_comment`. Close via PATCH only. |

**Known limitation:** Posting a comment on a `done` issue triggers automatic reopen. Always close via API PATCH without a follow-up comment.

### 6.3 Self-Analysis Methodology (How This Routine Was Audited)

When auditing the routine itself:

1. **Fetch routine config:** `GET /api/routines/{id}` → check status, assignee, policies
2. **Check run history:** `GET /api/routines/{id}/runs` → verify last runs completed
3. **Compare description to reality:** Does the described trigger match actual configuration?
4. **Check revisions:** `GET /api/routines/{id}/revisions` → verify latest revision is correct
5. **Verify SOP references:** Does the routine description point to the correct SOP file?
6. **Create backlog issues for problems found as child issues of the analysis issue**

### 6.4 Sustainability Checklist

Before closing any routine analysis issue:

- [ ] Routine configuration verified (schedule, concurrency, assignee)
- [ ] Run history checked (last run completed successfully)
- [ ] Report generated and archived in `reports/`
- [ ] Recommendation-to-Issue Pipeline abgeschlossen (Section 5.5):
  - [ ] Alle Recommendations als child issues mit `status: backlog` erstellt
  - [ ] Report mit Issue-Referenzen aktualisiert
  - [ ] CEO zur Delegation zugewiesen (assigneeAgentId = CEO)
- [ ] CEO hat delegiert: Issues von `backlog` auf `todo` gesetzt, Agenten zugewiesen
- [ ] Routine geschlossen via PATCH ohne follow-up comments (verhindert reopen loop)

---

## Appendix: API Authentication

All API calls require:
- **Header:** `Authorization: Bearer <MINERVA_API_KEY>`
- **Header:** `X-Tenant-Id: the_software_company`

The API key can be extracted from the Minerva server environment:
```bash
export MINERVA_API_KEY="$(tr '\0' '\n' < /proc/$(pgrep -f 'uvicorn.*8002')/environ | grep '^MINERVA_API_KEY=' | cut -d= -f2-)"
```

## Appendix: Error Recovery

| Error | Cause | Resolution |
|-------|-------|------------|
| `401 Unauthorized` | Invalid/missing API key | Check `MINERVA_API_KEY` env var |
| `422 Validation Error` | Missing required field | Check request body matches schema |
| Empty results | Pipeline not materialized | Run BPMN classification, discovery, benchmarks |
| Server unreachable | Minerva MCP down | Check service health, restart if needed |
| `tool_calls array is required` | Classify needs payload | Fetch events first, pass as tool_calls |
