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
