# RAC + AAC Template Design

## Overview

This document specifies the UI/UX design for the Engineering as Code template system, covering Requirements as Code (RAC) and Architecture as Code (AAC) templates. The implementation lives in `apps/frontend/src/views/Templates/`.

## Visual Truth

- Verified at 1440×900 desktop and 390×844 mobile
- Screenshots captured for: RAC default, RAC expanded, AAC default, AAC expanded, AAC template view
- TypeScript compilation: 0 errors
- Vite production build: 0 errors (61 modules, 2.05s)

## Design Tokens Used

All values from the existing design system (`packages/shared/src/design-system/`):

| Token | Usage |
|-------|-------|
| `--surface-primary` | Card backgrounds, page background |
| `--surface-secondary` | Code preview backgrounds, metadata bar |
| `--surface-tertiary` | Tag/chip backgrounds |
| `--text-primary` | Headings, titles, decision text |
| `--text-secondary` | Body text, descriptions |
| `--text-tertiary` | Labels, metadata, helper text |
| `--border-default` | Card borders, dividers |
| `primary-*` | RAC tab accent, REQ badges, action buttons |
| `secondary-*` | AAC tab accent, ADR status badges |
| `success-*` | Positive consequences, acceptance criteria ✓ |
| `error-*` | Negative consequences |
| `warning-*` | Dependency badges, neutral items |
| `info-*` | Issue references, type badges |

### Spacing Scale
- `gap-2` (8px): Between icon and text in badge rows
- `gap-3` (12px): Between sibling cards
- `gap-4` (16px): Section spacing within cards
- `gap-5` (20px): Between major sections in expanded ADR
- `gap-6` (24px): Between RAC header and content

### Typography Scale
- `text-xs` (12px): Badges, labels, metadata, code
- `text-sm` (14px): Body text, descriptions
- `text-base` (16px): Card titles, section headings
- `text-xl` (20px): Component section headings
- `text-2xl` (24px): Page title

## RAC Template (Requirements as Code)

### Component: `Templates/index.tsx`
Tabbed container with keyboard-navigable tablist. Two tabs: "Requirements (RAC)" and "Architecture (AAC)". Uses existing `<Nav>`-compatible tab pattern with `border-b-[3px]` active indicator.

### Component: `Templates/RacTemplate.tsx`

#### Structure

```
┌──────────────────────────────────────────────┐
│  RAC + AAC Template Design                   │
│  Design specifications for the Engineering   │
│  as Code template system.                    │
├──────────────────────────────────────────────┤
│  [Requirements (RAC) | Architecture (AAC)]   │
├──────────────────────────────────────────────┤
│  Requirements as Code (RAC)    [New from ..] │
│  Structured YAML requirement documents...    │
├──────────────────────────────────────────────┤
│  [Template card - border-l-4 primary]        │
│  Shows raw YAML template with copy guidance  │
├──────────────────────────────────────────────┤
│  Document Metadata                           │
│  ┌────────────────────────────────────────┐  │
│  │ Domain │ Schema │ Version │ Author │..│  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  REQ-AUTH-001  functional  high  approved    │
│  User Login with Email                       │
│  The system MUST allow a user to log in...   │
│  ──────────────────────────────────────────   │
│  [expanded: tags, acceptance criteria,        │
│   dependencies, related issues, notes]        │
├──────────────────────────────────────────────┤
│  REQ-AUTH-002  non-functional  medium prop.. │
│  Session Timeout                              │
│  Sessions MUST expire after 30 minutes...    │
└──────────────────────────────────────────────┘
```

#### States

| State | Behavior |
|-------|----------|
| **Default** | Collapsed list of requirements sorted by priority (critical → low). Each card shows ID badge, type/priority/status badges, title, and 2-line description. |
| **Expanded** | Click toggles a section below the card revealing: tags, acceptance criteria, dependencies, related issues, notes. Chevron rotates 180°. |
| **Template Overlay** | "New from Template" button toggles a `border-l-4 border-l-primary-500` elevated card showing the raw YAML template with usage guidance. |
| **Empty** | Dashed border card with document icon, "No requirements yet" message, and "Create from Template" CTA button. |

#### Badge Mapping

**Type badges** use info-tone variants from the existing Badge component:

| Requirement Type | Badge Variant |
|-----------------|---------------|
| `functional` | `info` |
| `non-functional` | `tracesTo` |
| `system` | `block` |
| `user` | `port` |

**Priority badges** use the existing named variants:

| Priority | Badge Variant |
|----------|---------------|
| `critical` | `critical` |
| `high` | `high` |
| `medium` | `medium` |
| `low` | `low` |

**Status badges** use the existing lifecycle variants:

| Status | Badge Variant |
|--------|---------------|
| `proposed` | `proposed` |
| `approved` | `approved` |
| `rejected` | `rejected` |
| `implemented` | `implemented` |
| `verified` | `verified` |

#### Acceptance Criteria Display

Each criterion rendered as a list item with a green circled checkmark (✓) prefix on `success-100`/`success-700` background. Text color `text-text-secondary`.

#### Dependencies Display

Rendered as monospace chips on `warning-50`/`warning-700` background for visual distinction from tags.

#### Related Issues Display

Rendered as monospace chips on `info-50`/`info-700` background.

### Accessibility

- Tablist is keyboard-navigable with ArrowLeft/Right/Home/End (matches ArtifactViewer pattern)
- Expandable cards use `<button>` elements with `focus-visible:ring-2`
- Badges use semantic color tokens that meet WCAG AA contrast
- Template code block uses `aria-label` for screen reader context
- Metadata bar uses semantic `<span>` grouping

## AAC Template (Architecture as Code)

### Component: `Templates/AacTemplate.tsx`

#### Structure

```
┌──────────────────────────────────────────────┐
│  Architecture as Code (AAC)    [New from ..] │
│  Architecture Decision Records (ADRs) as     │
│  Markdown documents with structured...       │
├──────────────────────────────────────────────┤
│  [Template card - border-l-4 secondary]      │
│  Shows raw ADR markdown template             │
├──────────────────────────────────────────────┤
│  Architecture Decision Records  (2 ADRs)     │
│  ┌────────────────────────────────────────┐  │
│  │ ADR-001  Accepted  2026-07-18          │  │
│  │ Authentication Strategy                │  │
│  │ Deciders: CTO, Security...             │  │
│  │ Issue: THE-191                         │  │
│  ├────────────────────────────────────────┤  │
│  │ [expanded]:                            │  │
│  │ Context    ─ paragraph text            │  │
│  │ Decision   ─ bordered highlight box    │  │
│  │ Consequences ─ +/−/~ lists             │  │
│  │ Alternatives ─ grid of option cards    │  │
│  │ Related     ─ monospace chips          │  │
│  │ Notes       ─ bullet list              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ ADR-002  Proposed  2026-07-18          │  │
│  │ RBAC Data Model                        │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

#### States

| State | Behavior |
|-------|----------|
| **Default** | Collapsed list of ADRs sorted by status priority (Accepted → Proposed → Deprecated → Superseded). Each card shows ADR header: number badge, status badge, date, title, deciders, issue. |
| **Expanded** | Click toggles full ADR content: Context section (paragraph), Decision (bordered highlight box with `bg-surface-secondary`), Consequences (typed lists with +/−/~ icons), Alternatives Considered (2-column grid of option cards with pros/cons), Related Decisions (chips), Notes (dot list). |
| **Template Overlay** | Same pattern as RAC: border-l-4 `border-l-secondary-500` card with raw Markdown template. |
| **Empty** | Gear icon card with "No ADRs yet" message and CTA. |

#### ADR Status Badge Mapping

| Status | Badge Variant |
|--------|---------------|
| `Proposed` | `proposed` |
| `Accepted` | `approved` |
| `Deprecated` | `rejected` |
| `Superseded` | `conflictsWith` |

#### Consequences Display

Three typed lists each with semantic icons:
- **Positive (+)** — green circle with `+` on `success-100`/`success-700`
- **Negative (−)** — red circle with `−` on `error-100`/`error-700`
- **Neutral (~)** — gray circle with `~` on `neutral-100`/`neutral-500`

#### Alternatives Considered Display

Each alternative rendered as a `<Card variant="outlined" padding="sm">` with:
- Title (text-sm, semibold)
- Description (text-xs, secondary)
- 2-column grid: Pros (green header) vs Cons (red header)
- "Why not chosen" in italic tertiary text (text-[11px])

### Responsive Behavior

- **Desktop (1440×900)**: Full layout, gap-6 spacing, inline metadata bar
- **Mobile (390×844)**: Stacked layout, metadata bar wraps to 2 columns, full-width cards, template code blocks horizontally scrollable (`overflow-x-auto`)
- Tab bar scrolls horizontally on mobile if tabs overflow

## Integration Points

### New Template Section
- Added to `App.tsx` as `#templates` route with nav item "Templates"
- Renders between Graph Builder and Admin sections in the navigation
- Auth-gated (requires valid session)

### API Integration (Future)
The template view currently uses sample data. For production:
- RAC documents should come from `GET /api/requirements`
- AAC/ADR documents should come from `GET /api/aac`
- Template content should come from `GET /api/aac/template`

## Design System Changes

No new design system tokens or components were introduced. All visual elements use the existing:
- `Button` (variant="secondary", size="sm", icon support)
- `Card` (variant="default", variant="outlined", variant="elevated", padding="sm"|"md"|"lg")
- `Badge` (all existing variants)
- `Stack` (gap={2,3,4,5,6})
- `cn()` utility for conditional classes

## Edge Cases

| Case | Handling |
|------|----------|
| **No requirements/ADRs** | Empty state card with icon, message, and CTA button |
| **Very long description** | `line-clamp-2` on collapsed cards, full text on expand |
| **Many tags** | Flex-wrap container, no truncation |
| **Many alternatives** | Stack layout (not grid) on mobile |
| **Long metadata values** | Source path wraps naturally in metadata bar |
| **Expanded + template open** | Both states independent; template toggles independently of card expansion |

## Tradeoffs

1. **Sample data vs API:** Current implementation uses hardcoded sample data matching the YAML template schema. API integration deferred to implementation sprint. This allows visual verification without backend dependency.
2. **Card expansion vs. separate detail page:** Inline expansion chosen over a separate detail page to reduce navigation steps (Hick's Law) and maintain context (Gestalt Common Region). For very long ADRs, expansion is acceptable since the data is structured prose.
3. **Code template vs. form wizard:** Raw template display chosen over a form-based wizard to maintain traceability with the file-based YAML/Markdown originals (Jakob's Law — engineers expect to see the file format). A form-based editor could be added as a future enhancement.

## Residual Risks

1. **Auth-gated rendering:** Verified with mocked sessionStorage. Production auth may behave differently.
2. **Sample data staleness:** Sample data must be updated when the RAC/AAC schemas evolve.
3. **Mobile template code:** The template code block is readable but not editable on mobile. Acceptable for the template reference use case.

## Acceptance Criteria

- [x] RAC tab shows sample requirement documents with priority-sorted cards
- [x] Each requirement card shows ID, type, priority, status badges + title + truncated description
- [x] Clicking a card expands to show tags, acceptance criteria, dependencies, issues, notes
- [x] AAC tab shows sample ADR documents sorted by status
- [x] Each ADR card shows number, status, date, title, deciders, issue
- [x] Clicking an ADR expands to show context, decision, consequences, alternatives, related, notes
- [x] "New from Template" button toggles code template overlay for each tab
- [x] Responsive layout works at 1440×900 and 390×844
- [x] All interactive elements keyboard-navigable with visible focus rings
- [x] Zero TypeScript and Vite build errors
- [x] All UI uses existing design system tokens and components only
