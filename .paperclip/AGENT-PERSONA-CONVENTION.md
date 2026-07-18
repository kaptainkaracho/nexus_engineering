# Agent/Persona as Code Convention

**Status:** Adopted
**Author:** CTO
**Date:** 2026-07-19
**Issue:** THE-221 (Epic D)

---

## 1. Summary

Agent/Persona as Code defines a standardized format for documenting engineering agent roles (personas) as version-controlled Markdown files. Each agent persona is a first-class engineering artifact with structured metadata, allowing consistent role definition, state tracking, and pipeline orchestration.

---

## 2. File Convention

| Attribute | Rule |
|-----------|------|
| **Format** | Markdown (`.md`) |
| **Location** | `.paperclip/context/{RoleName}.md` |
| **Naming** | `PascalCase` matching the agent role name (e.g., `CTO.md`, `FrontendArchitect.md`) |
| **Template** | `.paperclip/context/TEMPLATE.md` |

### 2.1 Required Metadata Block

Every agent persona file MUST begin with this YAML frontmatter block:

```yaml
---
schema: agent-persona/v1
name: <Agent Role Name>
role: <Role Title>
status: active | inactive
issue: <Current THE issue or null>
updated: <YYYY-MM-DD>
---
```

### 2.2 Required Sections

After the frontmatter, the file MUST contain these sections in order:

| Section | Required | Description |
|---------|----------|-------------|
| `## Last Run` | Yes | Timestamp of last heartbeat, issue worked, status |
| `## Current Assignment` | Yes | Active issue reference, disposition, status |
| `## Files Created/Modified` | Yes | Enumeration of files changed in current assignment |
| `## Next Action` | Yes | Concrete next step or standing-by notice |
| `## Blockers` | Yes | List of blockers with named unblock owner/action |

### 2.3 Optional Sections

| Section | Description |
|---------|-------------|
| `## Pipeline State` | Per-agent pipeline metrics |
| `## Done` | Historical log of completed issues |
| `## Notes` | Contextual notes not fitting other sections |

### 2.4 State Management

- `status: active` — Agent has an active assignment
- `status: inactive` — Agent is idle, no current assignment
- When an agent completes or is reassigned, update `issue` to `null` or the new issue reference
- `updated` MUST reflect the last modification date (use ISO 8601 date or datetime)

---

## 3. Lifecycle

1. **Creation:** Copy `TEMPLATE.md` to `.paperclip/context/{RoleName}.md`, fill metadata and initial sections
2. **Assignment:** Update `issue` field, set `status: active`, populate `Current Assignment`
3. **Heartbeat:** Update `Last Run`, `Files Created/Modified`, `Next Action`
4. **Completion:** Clear `issue`, set `status: inactive` if no next assignment, log to `Done`
5. **Removal:** Archive the file (do not delete without CEO approval)

---

## 4. Example

```yaml
---
schema: agent-persona/v1
name: BackendArchitect
role: Backend Execution Engineer
status: active
issue: THE-218
updated: 2026-07-19
---

## Last Run
- Issue: THE-218 — TAC Shared Package
- Timestamp: 2026-07-19T23:55:00Z
- Status: In progress

## Current Assignment
- **THE-218** — TAC Shared Package (schema, loader, validator)
- Status: in_progress

## Files Created/Modified
- `packages/shared/src/tests/schema.ts` (created)
- `packages/shared/src/tests/loader.ts` (created)

## Next Action
- Implement JSON Schema for test-doc/v1

## Blockers
- None
```

---

## 5. Enforcement

- CTO enforces this convention during onboarding of new agents
- All existing agent persona files (`.paperclip/context/*.md`) must conform
- Updates to agent personas should be committed alongside the issue work they document
