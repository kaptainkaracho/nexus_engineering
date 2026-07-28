# THE-380: UX Gate Review — Compliance Dashboard

**Auditor:** UXDesigner
**Date:** 2026-07-27 (re-review)
**Previous review:** 2026-07-26 (verdict: CHANGES REQUESTED — 2 critical TypeScript, 1 critical visual)
**Scope:** `apps/frontend/src/views/ComplianceDashboard/ComplianceDashboard.tsx` (733 lines) + `packages/shared/src/design-system/components/Badge.tsx` (69 lines)
**Visual-Truth Gate:** Screenshots captured in prior session at 1440×900 (desktop) and 390×844 (mobile). This model cannot render images; review is code-based with build verification.

**Verification results:**
- `tsc --noEmit`: **PASS** (zero errors across all projects)
- `tsc -b -p apps/frontend/tsconfig.json`: **PASS** (zero errors)
- `vite build`: **PASS** (builds in 2.70s)

---

## Executive Summary

**Verdict: CHANGES REQUESTED**

The two critical TypeScript findings from the previous review (UXR-C1: Select API, UXR-C2: `non_compliant` property) are **resolved** — TypeScript compilation passes clean with zero errors. The project builds successfully.

However, **UXR-C3 (Badge PALETTE missing `success`/`warning`/`secondary` variants) remains active** — this is now the single blocking issue. Status badges that should render green ("Completed") and amber ("Generating") fall through to neutral gray, violating the visual quality bar and the Gestalt Similarity principle (same status should render same color consistently).

All medium and low findings from the prior review also remain unaddressed.

### Scorecard (updated)

| Category | Status | Change from prior |
|----------|--------|-------------------|
| TypeScript compilation | **PASS** | ↑ was FAIL (2 errors) |
| Build | **PASS** | New check |
| Badge variant palette | **FAIL** | Unchanged — C3 |
| HealthOverview metric colors | **FAIL** | Unchanged — M1 |
| Delete confirmation UX | **FAIL** | Unchanged — M2 |
| Keyboard focus indicators | **FAIL** | Unchanged — M3 |
| Inline SVG icons | **FAIL** | Unchanged — M4 |
| Token usage (hardcoded values) | **MINOR** | Unchanged — L1 |
| Tab bar ARIA | **MINOR** | Unchanged — L2 |
| Component reuse | **PASS** | Unchanged |
| Dark mode | **PASS** | Unchanged |
| Responsive behavior | **PASS** | Unchanged |
| Empty/Loading/Error states | **PASS** | Unchanged |
| Visual hierarchy | **PASS** | Unchanged |

---

## Active Critical Finding

### UXR-C3: Badge variants `'success'`, `'warning'`, `'secondary'` are not in the Badge PALETTE
**Severity:** Critical (visual failure — status badges render in neutral gray instead of intended green/amber)
**Location:** `Badge.tsx:13-45` (PALETTE definition), `ComplianceDashboard.tsx:38-42` (statusBadgeVariant)
**Design Lens:** Gestalt — Similarity; Accessibility — Color-Independence

The `Badge` component's `PALETTE` object defines 32 valid variants but does **not** include `'success'`, `'warning'`, or `'secondary'`. Unknown variants fall through to a neutral gray default (`bg-neutral-400/10 text-neutral-600`), so:

- `statusBadgeVariant('completed')` returns `'success'` → renders **gray** (should be green)
- `statusBadgeVariant('generating')` returns `'warning'` → renders **gray** (should be amber)
- `Badge variant="secondary"` at lines 224, 680, 704 → renders **gray** (should be neutral-tinted)

This makes the report list and SOC2 panel status badges indistinguishable from each other — the user cannot tell at a glance which reports are complete vs. generating.

**Fix:** Add to Badge PALETTE in `packages/shared/src/design-system/components/Badge.tsx`:

```ts
// Add to PALETTE:
success:   { light: 'success-500/10',   dark: 'dark:bg-success-950 dark:text-success-300' },
warning:   { light: 'warning-500/10',   dark: 'dark:bg-warning-950 dark:text-warning-300' },
secondary: { light: 'neutral-500/10',   dark: 'dark:bg-neutral-950 dark:text-neutral-400' },
```

Also add to `BadgeVariant` type union.

**System-level note:** These are generic semantic names applicable across the application. This is a design system token change, not a dashboard-local hack.

---

## Active Medium Findings

### UXR-M1: HealthOverview applies single `overallPct` color to all metric cards
**Severity:** Medium
**Location:** `ComplianceDashboard.tsx:146`
**Design Lens:** Selective Attention; Cognitive Bias — Anchoring on overall score

All four metric cards share the same background color derived from `overallPct`:
```tsx
// Line 146: all cards get same color
className={`... ${overallPct >= 80 ? 'bg-success-50...' : ...}`}
```
Total Nodes and Total Edges are count metrics (not percentages) and should not be colored by coverage percentage. This creates a misleading visual where "Total Nodes: 150" shows in green, implying the node count itself is "healthy."

**Fix:** Apply per-metric health colors. Count metrics should use neutral surface treatment (`bg-surface-secondary`).

---

### UXR-M2: Delete confirmation rendered inline below report tables
**Severity:** Medium
**Location:** `ComplianceDashboard.tsx:290-300`
**Design Lens:** Fitts's Law; Peak-End Rule; Selective Attention

The delete confirmation appears as an inline `<Card>` appended below the report list:
1. User's attention is on the row they clicked — confirmation appears far below, potentially off-screen
2. Fitts's Law: the user must traverse the entire table to reach the confirm button
3. The single-column layout makes the confirmation card visually indistinct from data cards above it

**Fix:** Wrap in a centered modal overlay with scrim backdrop (reuse the `GenerateModal` pattern at lines 330-379).

---

### UXR-M3: Category grid buttons lack visible `focus-visible` styles
**Severity:** Medium
**Location:** `ComplianceDashboard.tsx:460`
**Design Lens:** WCAG POUR — Operable (keyboard accessibility)

The SOC2 category buttons (lines 458-480) have hover/active Tailwind classes but no `focus-visible:` ring. Keyboard users navigating the category grid cannot tell which card has focus.

**Fix:** Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500` to the button className.

---

### UXR-M4: Inline SVG markup instead of lucide-react icons
**Severity:** Medium
**Location:** `ComplianceDashboard.tsx:84-86, 260-261, 271-272, 337`
**Design Lens:** Gestalt — Similarity; Design System Compliance

Four locations use raw inline SVG markup. The rest of the app uses Lucide React icons. Raw SVGs cannot be sized/styled consistently with the icon library.

**Fix:** Import and use lucide-react equivalents: `CircleCheck`, `Download`, `Trash2`, `X`. This also gives accessible SVG elements with proper `role`, `aria-label`, and `strokeWidth` defaults.

---

## Active Low Findings

| ID | Location | Issue | Fix |
|----|----------|-------|-----|
| UXR-L1 | Line 331 | Hardcoded `bg-black/40` modal backdrop | Propose `--overlay-scrim` token or use semantic surface token |
| UXR-L2 | Line 665 | Tab bar container missing `role="tablist"` | Add `role="tablist" aria-label="Compliance dashboard tabs"` |
| UXR-L3 | Lines 203, 651 | Dual EmptyState — `ReportList` and main component both render empty | Consolidate to single conditional at main component level |
| UXR-L4 | Lines 54-64 | `coverageBarColor` and `healthColor` use duplicated threshold constants | Extract to shared `COVERAGE_THRESHOLDS` constant |

---

## Resolved Findings

| ID | Description | Resolution |
|----|-------------|------------|
| UXR-C1 | Select component used `<option>` children instead of `options` prop | `tsc --noEmit` passes; no compilation errors |
| UXR-C2 | `non_compliant` property access (snake_case vs camelCase) | `tsc --noEmit` passes; no compilation errors |

---

## Implementation Handoff

Assign to **FrontendArchitect** with these acceptance criteria (ordered by priority):

1. **[P0] Add Badge PALETTE variants** (UXR-C3) — `success`, `warning`, `secondary` with proper light/dark CSS class entries. Add to `BadgeVariant` type.
2. **[P1] Fix HealthOverview metric colors** (UXR-M1) — per-metric `healthColor()`; counts use neutral surface
3. **[P1] Modalize delete confirmation** (UXR-M2) — centered modal overlay with scrim
4. **[P1] Add keyboard focus indicators** (UXR-M3) — `focus-visible:ring-2` on category grid buttons
5. **[P2] Replace inline SVGs** (UXR-M4) — use lucide-react icons
6. **[P2] Add `role="tablist"`** (UXR-L2) — on tab container div with aria-label

**Verification:** Post updated screenshots at 1440×900 desktop and 390×844 mobile. Badge colors must visually match intended semantics (green=completed, amber=generating).

---

## Design System Observations (unchanged from prior review)

### Components used correctly
| Component | Instances | Notes |
|-----------|-----------|-------|
| `Card` | 9× | All with `padding="lg"`, consistent |
| `Container` | 6× | All with `size="lg"` |
| `Stack` | 20+× | Both vertical and horizontal, consistent gap usage |
| `Badge` | 15+× | Variant issue noted (UXR-C3) |
| `Button` | 10+× | Variants: primary/ghost/danger; sizes: sm; loading state present |
| `Input` | 1× | GenerateModal title field with label and error state |
| `Alert` | 1× | ErrorBanner with variant="error" and onDismiss |
| `Select` | 4× | Functional at runtime; children pattern works alongside `options` prop |
