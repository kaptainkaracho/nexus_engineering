# ADR-{NUMBER}: {TITLE}

**Status:** {Proposed | Accepted | Deprecated | Superseded}  
**Date:** {YYYY-MM-DD}  
**Deciders:** {List of people involved in the decision}  
**Issue:** THE-{NUMBER} (link to Paperclip issue)

---

## Context

{What is the issue that we're seeing that is motivating this decision or change?}

{What is the context that is driving this decision?}

{What forces are at play (technical, political, social, project)?}

## Decision

{What is the change that we're proposing and/or doing?}

{Why is this decision being made?}

{What is the scope of this decision?}

## Consequences

### Positive

- {What becomes easier or more supported?}
- {What new capabilities are enabled?}
- {What are the benefits?}

### Negative

- {What becomes harder or less supported?}
- {What new limitations are introduced?}
- {What are the trade-offs?}

### Neutral

- {What are the implications that are neither positive nor negative?}
- {What are the things that don't change?}

## Alternatives Considered

### Option 1: {Alternative Name}

{Description of this alternative}

**Pros:**
- {Pro 1}
- {Pro 2}

**Cons:**
- {Con 1}
- {Con 2}

**Why not chosen:** {Brief explanation}

### Option 2: {Alternative Name}

{Description of this alternative}

**Pros:**
- {Pro 1}
- {Pro 2}

**Cons:**
- {Con 1}
- {Con 2}

**Why not chosen:** {Brief explanation}

## Related Decisions

- ADR-{NUMBER}: {Related decision title}
- ADR-{NUMBER}: {Related decision title}

## Notes

{Additional notes, references, or links}

---

## Template Usage

### Naming Convention
- File: `adr-{NUMBER}-{slug}.md`
- Example: `adr-001-authentication-strategy.md`

### Numbering
- Sequential: 001, 002, 003, etc.
- Zero-padded to 3 digits
- Never reuse numbers, even if ADR is superseded

### Status Values
- **Proposed:** Under discussion, not yet decided
- **Accepted:** Decision has been made and is in effect
- **Deprecated:** No longer recommended, but may still be in use
- **Superseded:** Replaced by a newer ADR (reference it in "Related Decisions")

### Required Sections
1. **Context:** Why this decision is needed
2. **Decision:** What was decided
3. **Consequences:** What the implications are

### Optional Sections
- **Alternatives Considered:** Other options evaluated
- **Related Decisions:** Links to other ADRs
- **Notes:** Additional context

### References
- [Michael Nygard's ADR article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub organization](https://adr.github.io/)