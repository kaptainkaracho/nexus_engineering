# Template Usage Guidelines

This document provides guidelines for using the RAC (Requirements as Code) and ADR (Architecture Decision Record) templates in the Nexus project.

## Table of Contents

1. [Overview](#overview)
2. [RAC Templates](#rac-templates)
3. [ADR Templates](#adr-templates)
4. [Naming Conventions](#naming-conventions)
5. [File Organization](#file-organization)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Overview

Nexus uses two types of "as code" documents:

- **RAC (Requirements as Code):** YAML-based requirement documents that define what the system must do
- **ADR (Architecture Decision Record):** Markdown-based records of architectural decisions

Both templates are designed to be:
- **Human-readable:** Clear structure and comments
- **Machine-parseable:** Consistent format for tooling
- **Version-controlled:** Stored alongside code in the repository
- **Traceable:** Linked to Paperclip issues for audit trail

---

## RAC Templates

### Template Location
```
docs/requirements/templates/
├── requirement-template.yaml      # Blank template
└── sample-requirement.req.yaml    # Example with sample data
```

### When to Use RAC

Use RAC templates when you need to:
- Define a new feature requirement
- Document a non-functional requirement (performance, security, etc.)
- Capture user-facing requirements
- Create testable acceptance criteria

### How to Create a New Requirement

1. **Copy the template:**
   ```bash
   cp docs/requirements/templates/requirement-template.yaml \
      docs/requirements/{domain}/{requirement-name}.req.yaml
   ```

2. **Fill in the metadata:**
   - `domain`: Group related requirements (e.g., Authentication, API, UI)
   - `version`: Start at 1.0.0, increment for breaking changes
   - `source`: Path to this file in the repository

3. **Add requirements:**
   - Use unique IDs: `REQ-{DOMAIN}-{NUMBER}`
   - Write clear, testable descriptions
   - Include acceptance criteria in Given/When/Then format
   - Link to related issues

4. **Validate locally:**
   ```bash
   # If CI validation is set up
   npm run validate:requirements
   ```

### RAC ID Format

```
REQ-{DOMAIN}-{NUMBER}
```

- **Domain:** 3-5 uppercase letters (AUTH, API, UI, DB, PERF, SEC, etc.)
- **Number:** 3-digit zero-padded (001, 002, etc.)
- **Examples:**
  - `REQ-AUTH-001` - First authentication requirement
  - `REQ-API-015` - 15th API requirement
  - `REQ-UI-003` - Third UI requirement

### Requirement Types

| Type | Description | Example |
|------|-------------|---------|
| `functional` | Specific behavior the system must exhibit | User login, data validation |
| `non-functional` | Quality attributes | Performance, security, usability |
| `system` | System-level requirements | Infrastructure, deployment |
| `user` | User-facing requirements | UX, accessibility |

### Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| `critical` | Blocking, must resolve immediately | Now |
| `high` | Must have, critical for release | Current sprint |
| `medium` | Should have, important but not critical | Next sprint |
| `low` | Nice to have, can be deferred | Backlog |

### Status Values

| Status | Description |
|--------|-------------|
| `proposed` | Initial state, under review |
| `approved` | Accepted and ready for implementation |
| `rejected` | Not accepted, with documented rationale |
| `implemented` | Code complete, ready for verification |
| `verified` | Tested and confirmed working |

---

## ADR Templates

### Template Location
```
docs/architecture/adr/templates/
├── adr-template.md                           # Blank template
└── sample-adr-001-authentication-strategy.md # Example with sample data
```

### When to Use ADRs

Use ADR templates when you need to:
- Record an architectural decision
- Document why a particular technology was chosen
- Capture trade-offs for future reference
- Create a decision audit trail

### How to Create a New ADR

1. **Copy the template:**
   ```bash
   cp docs/architecture/adr/templates/adr-template.md \
      docs/architecture/adr/adr-{NUMBER}-{slug}.md
   ```

2. **Fill in the header:**
   - `ADR-{NUMBER}: {TITLE}` - Sequential number and descriptive title
   - `Status`: Proposed, Accepted, Deprecated, or Superseded
   - `Date`: YYYY-MM-DD format
   - `Deciders`: People involved in the decision
   - `Issue`: Link to Paperclip issue (THE-{NUMBER})

3. **Write the sections:**
   - **Context:** Why this decision is needed
   - **Decision:** What was decided
   - **Consequences:** Positive, negative, and neutral implications
   - **Alternatives Considered:** Other options evaluated (optional but recommended)

4. **Update the index:**
   - Add entry to `docs/architecture/adr/README.md` if it exists

### ADR Numbering

- Sequential: 001, 002, 003, etc.
- Zero-padded to 3 digits
- **Never reuse numbers**, even if ADR is superseded
- Reference superseded ADR in "Related Decisions"

### ADR Status Values

| Status | Description |
|--------|-------------|
| `Proposed` | Under discussion, not yet decided |
| `Accepted` | Decision has been made and is in effect |
| `Deprecated` | No longer recommended, but may still be in use |
| `Superseded` | Replaced by a newer ADR |

---

## Naming Conventions

### File Names

- **RAC Files:** `{requirement-name}.req.yaml`
  - Use kebab-case for multi-word names
  - Include `.req.yaml` extension
  - Example: `user-login.req.yaml`

- **ADR Files:** `adr-{NUMBER}-{slug}.md`
  - Sequential number (zero-padded)
  - Descriptive slug in kebab-case
  - Example: `adr-001-authentication-strategy.md`

### Directory Structure

```
docs/
├── requirements/
│   ├── templates/
│   │   ├── requirement-template.yaml
│   │   └── sample-requirement.req.yaml
│   ├── auth/
│   │   ├── authentication.req.yaml
│   │   └── session-management.req.yaml
│   ├── api/
│   │   └── api-design.req.yaml
│   └── ui/
│       └── accessibility.req.yaml
└── architecture/
    ├── adr/
    │   ├── templates/
    │   │   ├── adr-template.md
    │   │   └── sample-adr-001-authentication-strategy.md
    │   ├── adr-001-authentication-strategy.md
    │   ├── adr-002-rbac-data-model.md
    │   └── README.md
    └── diagrams/
        ├── system-context.puml
        └── container.puml
```

---

## Best Practices

### General

1. **Keep documents focused:** One topic per file
2. **Use clear language:** Avoid jargon and acronyms
3. **Link to issues:** Always reference THE-{NUMBER} for traceability
4. **Version appropriately:** Increment version for breaking changes
5. **Review regularly:** Ensure documents stay current

### RAC-Specific

1. **Write testable requirements:** Each requirement should have verifiable acceptance criteria
2. **Use Given/When/Then format:** For acceptance criteria
3. **Keep descriptions concise:** Aim for 1-3 sentences
4. **Include dependencies:** Link related requirements
5. **Tag appropriately:** Use tags for filtering and categorization

### ADR-Specific

1. **Document alternatives:** Always consider and document other options
2. **Explain trade-offs:** Be honest about negative consequences
3. **Include context:** Future readers need to understand why
4. **Link related decisions:** Show how ADRs connect
5. **Keep status current:** Update when decisions change

---

## Examples

### Example 1: Creating a RAC Requirement

**Scenario:** You need to define a requirement for rate limiting on the API.

1. **Create the file:**
   ```bash
   cp docs/requirements/templates/requirement-template.yaml \
      docs/requirements/perf/rate-limiting.req.yaml
   ```

2. **Fill in the content:**
   ```yaml
   nexus:
     schema: req-doc/v1
     metadata:
       domain: Performance
       version: 1.0.0
       source: docs/requirements/perf/rate-limiting.req.yaml
       author: BackendArchitect
       createdAt: "2026-07-18"

   requirements:
     - id: REQ-PERF-001
       type: non-functional
       title: API Rate Limiting
       description: |
         The API MUST implement rate limiting to prevent abuse.
         Limits should be configurable per endpoint and user role.
       priority: high
       status: proposed
       tags:
         - api
         - security
         - performance
       acceptanceCriteria:
         - "Given an API endpoint, when a client exceeds the rate limit, then they receive a 429 response"
         - "Given a rate-limited client, when they wait, then they can make requests again after the window resets"
       relatedIssues:
         - THE-191
       notes: |
         Rate limits should be configurable via environment variables.
         Consider different limits for authenticated vs. anonymous users.
   ```

3. **Commit and create PR:**
   ```bash
   git add docs/requirements/perf/rate-limiting.req.yaml
   git commit -m "feat(rac): add rate limiting requirement"
   ```

### Example 2: Creating an ADR

**Scenario:** You need to document the decision to use Redis for session storage.

1. **Create the file:**
   ```bash
   cp docs/architecture/adr/templates/adr-template.md \
      docs/architecture/adr/adr-003-redis-session-storage.md
   ```

2. **Fill in the content:**
   ```markdown
   # ADR-003: Redis Session Storage

   **Status:** Proposed  
   **Date:** 2026-07-18  
   **Deciders:** CTO, BackendArchitect  
   **Issue:** THE-191

   ---

   ## Context

   We need a session storage solution that:
   - Supports TTL for automatic expiration
   - Provides fast read/write performance
   - Integrates with our existing infrastructure
   - Supports clustering for high availability

   ## Decision

   We will use **Redis** for session storage with:
   - Key pattern: `session:{sessionId}`
   - TTL: 7 days for refresh tokens, 15 minutes for access tokens
   - Serialization: JSON
   - Connection: Redis Cluster for production

   ## Consequences

   ### Positive

   - Fast read/write performance (sub-millisecond)
   - Built-in TTL support
   - Well-supported in Node.js ecosystem
   - Can be used for other caching needs

   ### Negative

   - Additional infrastructure to manage
   - Memory usage can grow quickly
   - Requires monitoring and alerting

   ### Neutral

   - Existing code needs to be updated to use Redis
   - Documentation needed for setup and configuration

   ## Alternatives Considered

   ### Option 1: PostgreSQL

   **Pros:**
   - Already in our stack
   - ACID compliance
   - Better querying capabilities

   **Cons:**
   - Slower for session operations
   - No built-in TTL
   - Requires custom cleanup logic

   **Why not chosen:** Performance and TTL requirements.

   ### Option 2: In-Memory Store

   **Pros:**
   - Fastest possible performance
   - No external dependencies

   **Cons:**
   - Data loss on restart
   - No clustering support
   - Memory limitations

   **Why not chosen:** Reliability and scalability concerns.

   ## Related Decisions

   - ADR-001: Authentication Strategy
   - ADR-002: RBAC Data Model

   ## Notes

   - **Monitoring:** Monitor memory usage and eviction rates
   - **Backup:** Consider Redis persistence options
   - **Security:** Use TLS for production connections
   ```

3. **Commit and create PR:**
   ```bash
   git add docs/architecture/adr/adr-003-redis-session-storage.md
   git commit -m "docs(adr): add Redis session storage decision"
   ```

---

## Validation

### RAC Validation

When CI validation is set up, run:
```bash
npm run validate:requirements
```

This will:
- Validate YAML syntax
- Check schema compliance
- Verify ID uniqueness
- Check for required fields

### ADR Validation

Manual validation checklist:
- [ ] File name follows `adr-{NUMBER}-{slug}.md` format
- [ ] Number is sequential and unique
- [ ] Status is one of: Proposed, Accepted, Deprecated, Superseded
- [ ] All required sections are present (Context, Decision, Consequences)
- [ ] Related ADRs are referenced correctly
- [ ] Issue reference is valid (THE-{NUMBER})

---

## Getting Help

- **Questions:** Ask in the #docs Slack channel
- **Issues:** Create a THE issue with `documentation` label
- **Proposals:** Create a PR with your changes and tag @UXDesigner for review

---

*Last updated: 2026-07-18 by UXDesigner*