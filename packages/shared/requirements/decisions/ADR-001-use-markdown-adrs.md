---
title: "Use Markdown ADRs with YAML Frontmatter for Architecture Decision Records"
status: accepted
date: 2026-07-01
superseded_by: 
---

# Context

The Bike App project needs a lightweight, version-controllable format for recording architectural decisions alongside code. Previous approaches using centralized docs or XML files were difficult to review in PRs and kept decisions far from the relevant code. The engineering team is already using `.arch.yaml` for architecture models and `.req.yaml` for requirements — we need an equally simple, co-located approach for Architecture Decision Records that aligns with the existing artifact detection pipeline (ArtifactDetector classifies `ADR-*` as `'adr'`).

# Decision

We adopted ADR-*.md files with YAML frontmatter to store Architecture Decision Records in the repository. Each file follows a standard structure:

- YAML frontmatter for structured metadata (title, status, date, superseded_by)
- Markdown body for narrative sections (Context, Decision, Consequences)
- Files live alongside related code artifacts under `packages/shared/requirements/decisions/`

This format is parseable by the existing RepositoryParser which extracts frontmatter via js-yaml and supports `.md` files with inline content. The ArtifactDetector already routes ADR files to its dedicated arc without conflating them with generic requirements or architecture models.

# Consequences

- Decisions are co-located with code and reviewable in PRs
- No new tooling needed — existing markdown parser + js-yaml frontmatter extraction handles parsing
- Requires THE-160 implementation: ADR-specific body section extraction (Context, Decision, Consequences) in RepositoryParser
- The BackendArchitect must implement parser extensions to lift ADR fields into `ParsedDocument.metadata` for the traceability graph
- Once loaded from the filesystem, all Markdown and YAML files are treated as untrusted text by design — no code execution or template rendering occurs on load
- Teams must adopt this naming convention (`ADR-<three-digit>-<descriptive-slug>.md`) for all new architecture decisions
- The `superseded_by` field enables ADR chains (e.g., `superseded_by: "ADR-042"` tracks migration paths)
