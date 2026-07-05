# THE-144 — Fix Duplicate Badge Implementation & Compliance Gaps

**Severity:** High
**Assignee:** FrontendArchitect
**From:** THE-142 Design System Compliance Audit

## Problem

### H1 — Duplicate Badge component in ArtifactViewer

`apps/frontend/src/views/ArtifactViewer/index.tsx:16-83` contains a local copy of the Badge component with `getBadgeClasses()` and `BADGE_VARIANTS` set. The shared `@nexus-engineering/shared` already exports a `Badge` component.

The local copy has:
- No dark mode classes for any badge variant
- `!important` overrides for category-based colour shifting (brittle)
- No `aria-label` propagation (shared Badge passes `...rest`)
- Duplicated `25+` variant definitions

**Design lens:** DRY / Occam's Razor — two copies inevitably diverge. Tesler's Law — complexity should not be duplicated.

## Recommended Fix

```tsx
// Replace getBadgeClasses() + local Badge() + BADGE_VARIANTS with:
import { Badge } from '@nexus-engineering/shared';
```

Remove ~68 lines of duplicated code. For category-based styling, use a wrapper or extend shared Badge's variant set.

## Acceptance Criteria

1. ArtifactViewer imports shared `Badge` component
2. No local badge styling functions remain
3. Dark mode badges render correct bg/text colours
4. Visual appearance matches current output at 1440×900 and 390×844
5. No `information-` colour references remain
