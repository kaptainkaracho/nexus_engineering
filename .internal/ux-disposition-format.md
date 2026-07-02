# UXDesigner Disposition Format (THE-68)

**Purpose:** Prevent loop recurrence by establishing a strict, machine-readable disposition checklist for all UXDesigner deliverables.

## Standardized Disposition Checklist

Every UXDesigner task MUST close with ALL items below:

### 1. Artifact Inventory (Required)
| Item | Description | Format |
|------|-------------|--------|
| `--deliverables` | Enum of delivered artifacts | `[design-spec, components, tokens, screenshots, Figma URL, ...]` |
| `--file-count=N` | Number of files created/modified | integer |
| `--doc-path=<path>` | Primary documentation file path | relative repo path |
| `--component-lib=<yes/no>` | Whether component library was delivered | boolean toggle |

### 2. Acceptance Criteria (Required)
- [ ] Design tokens defined (color palette, spacing, typography, shadows)
- [ ] Component interface specifications documented (props table with types)
- [ ] Accessibility criteria met (WCAG AA contrast, keyboard navigation)
- [ ] Screenshots generated at required breakpoints (desktop 1440px + mobile 390px)
- [ ] Dark mode variants completed for all tokens/components
- [ ] Tailwind config integration documented

### 3. Closure Statement (Required format — use this exact structure)
```
**Disposition:** Complete | **Date:** YYYY-MM-DD
**Deliverables:** [...]
**Files Delivered:** N files across <X> directories
**Acceptance:** All criteria met / Partial: [itemize gaps]
**Next State:** Ready for implementation (`in_progress`) / Needs refinement 
```

### 4. Gate Status (Required — enforced by CTO)
| Gate | Verdict | Required Before Move to `done` |
|------|---------|-------------------------------|
| UXDesigner self-approval | PASS/FAIL | Always |
| FrontendArchitect review | PASS/FAIL | Before merge |
| CTO quality gate | PASS/FAIL | Before merge |

### 5. Loop Prevention Rules (NON-NEGOTIABLE)
1. **No reassignment without artifacts:** A task may NOT be reassigned unless all deliverables in section 1 are populated.
2. **Orphaned files = loop detected:** Uncommitted design files beyond 2 heartbeats after assignment → automatic CTO escalation to CEO.
3. **Disposition required before `done`:** Task cannot transition to `done` without sections 1-4 completed.
4. **No partial dispositions:** If ANY acceptance criteria item is unchecked, disposition status MUST be `needs_refinement` — never auto-closed.

## Implementation

This format is stored in: `.internal/ux-disposition-format.md`

**Effective immediately.** All future UXDesigner tasks MUST use this template.
THE-66 closure also uses this template retroactively.
