# ADR-001: Requirements as Code (RAC)

**Status:** Accepted
**Date:** 2026-07-18
**Deciders:** CTO, BackendArchitect, CEO
**Issue:** THE-190

---

## Context

Nexus Engineering platform needs a structured, version-controlled way to manage requirements. Traditional requirements documents (Word, Google Docs, Confluence) suffer from:

- Lack of version history tied to code changes
- No automated validation or traceability
- Difficult to link to implementation issues and test cases
- Manual synchronization with the development process

The board has mandated "Engineering as Code" — treating engineering artifacts as code with the same rigor as the production codebase.

## Decision

We adopt **Requirements as Code (RAC)** using YAML-based requirement documents stored in `/docs/requirements/`.

**Format:** YAML files with `.req.yaml` extension, validated against the `req-doc/v1` JSON schema.

**Structure:**
- Document metadata in `nexus` block (schema, domain, version, source)
- Requirements array with typed fields (id, type, title, description, priority, status)
- Optional: acceptanceCriteria, dependencies, relatedIssues, tags, notes
- Two-way traceability via `relatedIssues` (THE-XXX) and `dependencies` (REQ-XXX)

**API Endpoints:**
- `GET /api/rac` — List all RAC documents
- `GET /api/rac/:id` — Get a single RAC document
- `POST /api/rac/validate` — Validate a RAC document against the schema
- `GET /api/rac/schema` — Return the JSON schema for RAC documents

**CI Validation:** RAC files are validated on PR via the JSON schema to ensure format compliance and issue reference existence.

## Consequences

### Positive

- Requirements are version-controlled alongside code
- Automated validation catches format errors early
- Machine-readable format enables tooling and automation
- Clear traceability from requirements to issues to implementation
- Easy to review changes in pull requests

### Negative

- Requires team adoption of YAML format (learning curve)
- Less flexible than free-form documents for early-stage exploration
- May need migration tooling for existing requirements

### Neutral

- Template files in `/docs/requirements/templates/` ease onboarding
- Existing YAML schemas in `packages/shared/src/requirements/schema.ts` provide validation

## Alternatives Considered

### Option 1: Markdown-Based Requirements

**Pros:** Familiar format, minimal learning curve
**Cons:** Hard to validate programmatically, unstructured metadata
**Why not chosen:** YAML provides structured validation and machine readability

### Option 2: Dedicated Requirements Management Tool

**Pros:** Rich UI, built-in traceability
**Cons:** External dependency, no git integration, cost
**Why not chosen:** Violates "Engineering as Code" principle

## Related Decisions

- ADR-002: Architecture as Code (AAC)

## Notes

RAC is Tier 1 of the four-tier "Engineering as Code" framework. Subsequent tiers build on this foundation.
