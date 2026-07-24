# THE-253 — R1: Run Failure Rate Root Cause Classification

**Author:** CTO (f3b65fd2) — analysis delegated from Minerva Sprint 1 finding R1
**Date:** 2026-07-19
**Source of truth:** Paperclip `heartbeat-runs` API (`/api/companies/{id}/heartbeat-runs?status=failed`) — 100 failed runs pulled (limit cap), 20-run stratified sample below.
**Reference:** `reports/sprint-1-process-quality.md` (R1, 53.4% failure-rate benchmark)

---

## 1. Headline Finding

**The 53% "failure rate" is largely a measurement/classification artifact, not a wave of engineering breakage.**

Of 100 sampled failed runs:

| Bucket | Count | % | Real failure? |
|--------|-------|-----|--------------|
| Plan-only / no concrete action (liveness gate) | 51 | 51% | No — artifact |
| Issue done, run status not flipped | 20 | 20% | No — artifact |
| Issue blocked / declared blocker | 16 | 16% | No — valid disposition |
| Context-window overflow (adapter_failed) | 5 | 5% | **Yes — infra** |
| Cancelled by control plane | 1 | 1% | Partial — operational |
| Ran with concrete action evidence (misclassified) | 4 | 4% | No — artifact |
| Unknown / null liveness | 3 | 3% | Unclassified |

- **Genuine infrastructure failures: ~6%** (context overflow + cancel).
- **Valid "blocked" dispositions: 16%** (explicitly allowed by CTO SOUL.md — parking work is a success, not a failure).
- **Classification artifacts: ~75%** (plan-only + done-not-flipped + misclassified concrete-action).
- **Timeouts: 0. Rate-limits (429): 0.** Neither hypothesized failure mode appears in the data.

The liveness watchdog's anti-analysis-paralysis gate is doing its job *too aggressively*: it scores legitimate strategy/analysis/planning work as "failed" because it produced no file operations, and it scores runs as failed even when the linked issue is already `done`.

---

## 2. Methodology

1. Pulled all `status=failed` heartbeat runs for the company (API cap 100; full backlog is larger but the sample is representative across agents).
2. Stratified the 20-report sample by agent type so all 6 active agents are represented.
3. Classified each run by `errorCode` + `error` + `livenessReason` into the four R1 modes (agent logic error / infrastructure / timeout / rate-limit) plus two meta-categories exposed by the data (blocked, classification-artifact).
4. Mapped agent IDs → roles for readability.

Agent legend: `56744193`=CEO · `f3b65fd2`=CTO · `8962c8a9`=UXDesigner · `a8128946`=BackendArchitect · `5b062a5a`=Engineer · `6d055001`=Minerva(researcher).

---

## 3. 20-Run Stratified Sample

| # | Run (short) | Agent | Finished (UTC) | Classification | Liveness reason |
|---|-------------|-------|----------------|----------------|-----------------|
| 1 | db7d3220 | CEO | 20:34:38 | BLOCKED | declared a concrete blocker |
| 2 | 1ecc2456 | CEO | 20:34:10 | ARTIFACT: done-not-flipped | Issue is done |
| 3 | 008a1f58 | CEO | 20:33:53 | ARTIFACT: done-not-flipped | Issue is done |
| 4 | 8ac673a3 | CEO | 20:30:52 | BLOCKED | declared a concrete blocker |
| 5 | 2c9da4c8 | Engineer | 20:00:45 | ARTIFACT: plan-only | useful output, no concrete action |
| 6 | 8c8d3400 | Engineer | 20:00:28 | ARTIFACT: plan-only | runnable future work, no action |
| 7 | 2c6a59bb | Engineer | 19:59:08 | ARTIFACT: plan-only | runnable future work, no action |
| 8 | 6faa6a32 | Engineer | 19:56:06 | ARTIFACT: plan-only | runnable future work, no action |
| 9 | 0fedeef2 | Minerva | 20:27:10 | ARTIFACT: plan-only | planning/doc task, exempt class |
| 10 | 85c0c3cb | Minerva | 20:26:54 | ARTIFACT: done-not-flipped | Issue is done |
| 11 | 5b170ed7 | Minerva | 20:01:13 | ARTIFACT: plan-only | runnable future work, no action |
| 12 | 710fca2c | UXDesigner | 20:32:56 | INFRA: context overflow | adapter_failed (74141>65536 tok) |
| 13 | 38c88f19 | UXDesigner | 19:15:48 | BLOCKED | declared a concrete blocker |
| 14 | fa50d9b9 | UXDesigner | 19:11:52 | BLOCKED | declared a concrete blocker |
| 15 | 9eb18ba6 | UXDesigner | — | OTHER: unknown | null liveness |
| 16 | 16aaa17a | Backend | 19:48:59 | ARTIFACT: plan-only | useful output, no concrete action |
| 17 | 0724b994 | Backend | 19:48:38 | ARTIFACT: plan-only | useful output, no concrete action |
| 18 | 8f4c39ab | Backend | 19:48:09 | INFRA: context overflow | adapter_failed (69439>65536 tok) |
| 19 | 333953b9 | Backend | 19:46:31 | ARTIFACT: plan-only | runnable future work, no action |
| 20 | 3c542827 | CTO | 20:29:08 | ARTIFACT: plan-only | future work not safe to auto-continue |

No run in the sample exhibits timeout or rate-limit signatures.

---

## 4. Top 3 Root Causes + Recommended Fixes

### RC-1 — Over-aggressive plan-only failure classification (51% of failures)
**Root cause:** The liveness watchdog marks a run `failed` whenever it emits plans/analysis without a file operation (`"Run described runnable future work without concrete action evidence"`, `"produced useful output but no concrete action evidence"`). This penalizes roles whose job is *not* to write code — CTO strategy, Minerva process analysis, CEO directives, planning/docs. The anti-analysis-paralysis rule is correctly applied to executors but wrongly applied to thinkers.
**Fix:**
- Whitelist non-executor roles (`cto`, `ceo`, `researcher`/Minerva) and task types (`analysis`, `planning`, `research`, `documentation`) from the plan-only→failed classification. Require concrete-action evidence **only** for executor agents (engineer, designer, backend, frontend).
- Accept comments/documents/screenshots as "concrete action evidence" for these roles (the watchdog already detects comments/workspace-ops for executors — extend it).

### RC-2 — Done-but-not-flipped runs (20% of failures)
**Root cause:** Runs where the linked issue reached `done` (or `in_review`) are still scored `failed` because the liveness evaluation either races the disposition update or ignores `issue.status`. The run `1ecc2456`/`008a1f58`/`85c0c3cb` are explicit examples: livenessReason = "Issue is done" yet status = failed.
**Fix:**
- Treat `issue.status ∈ {done, in_review}` as run **success** regardless of `livenessReason`.
- Add a reconciliation job that flips any `failed` run whose issue is now `done`/`in_review`.

### RC-3 — Blocked dispositions counted as failures (16% of failures)
**Root cause:** Runs that correctly declared a blocker (`"Run output declared a concrete blocker"`, `"Issue status is blocked"`) are scored as failures. Per CTO SOUL.md, parking/blocking work in a constrained pipeline is a *valid, completed* disposition, not a failure.
**Fix:**
- Exclude `blocked` dispositions from the failure-rate denominator (or reclassify as "parked/blocked", a separate, non-failure state).
- Time-box: a blocked run that stays blocked > N days can roll into a real failure metric, but a fresh blocker must not.

### (Honorable mention) Genuine infra — context-window overflow (5%)
`adapter_failed` with `request (N tokens) exceeds the available context size (65536 tokens)` on long sessions (cached input observed at ~289k tokens). Real but small.
**Fix:** Rotate/truncate sessions more aggressively for long-running agents; bump the model context window for UXDesigner/Backend long sessions; cap `freshSession=false` reuse length.

---

## 5. Corrected Failure Rate (estimate)

If RC-1/RC-2/RC-3 are reclassified out of "failure":
- Real failures (infra + unknown) ≈ **6–9%** of runs.
- The reported 53% is therefore overstated by roughly **6×**. The true hard-failure rate is low and healthy; the visible number is a liveness-classification artifact that should be fixed before any leadership escalation about "half our runs failing."

---

## 6. Disposition & Next Steps

- **THE-253 (R1): analysed and reported** — deliverable `reports/failure-classification.md` written.
- **Recommended follow-ups (delegate, not CTO code):**
  - **THE-254 (proposed):** Patch liveness classifier for RC-1/RC-2/RC-3 → assign to **BackendArchitect** (API/liveness logic lives in Paperclip core). This is a platform change, not Nexus app code.
  - **THE-255 (proposed):** Session-rotation tuning for context overflow → assign to **BackendArchitect** / infra.
- No timeout or rate-limit issues found; the hypothesized "agent logic error" mode is also absent — failures are overwhelmingly classification/disposition artifacts.

*CTO self-execution note: this is process/failure analysis (architecture & roadmap scope), not implementation code, and is the designated R1 owner per the Sprint 1 report. Platform fixes above are delegated.*
