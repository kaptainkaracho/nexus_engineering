# THE-142 Design System Compliance Audit

**Auditor:** UXDesigner
**Date:** 2026-07-04
**Status:** Complete
**Scope:** All frontend code + shared design system package against DESIGN_SYSTEM.md v0.1

## Summary

| Severity | Count | Actionable |
|----------|-------|------------|
| Critical | 2 | Fixed in this run |
| High | 3 | 1 fixed, 2 child issues |
| Medium | 3 | Child issue |
| Low | 2 | 1 fixed, 1 note |

**Fixes applied in THE-142 run:**
- C1, C2: Badge.tsx palette — all 26 variants now have correct `dark:bg-{color}-950 dark:text-{color}-300` pattern. No empty `dark: ''` entries. No `information-` typo references.
- H2: `App.tsx:69` — `text-white` → `text-text-inverse` on logo text
- H3: `index.css:18` — `text-neutral-50` → `text-text-primary` in body dark mode
- `ArtifactViewer/index.tsx` — three `information-` typos fixed to `info-`
- Remaining 2 high + 3 medium items documented as child issues below

---

## CRITICAL (fix now)

### C1 — Badge dark-mode palette has empty strings for 6 variants

**File:** `packages/shared/src/design-system/components/Badge.tsx:24,30,34-36,38`
**Variants:** `ready`, `tracesTo`, `block`, `part`, `port`, `info`

These variants have `{ dark: '' }` in the PALETTE. The template literal on line 55:
```
isKnown ? `bg-${entry.light} ${entry.dark}` : ...
```
renders them with light-mode bg but **no dark-mode text color**. In dark mode these badges lack explicit text color, inheriting context color — likely invisible against dark backgrounds.

**Design lens:** WCAG POUR — content must be perceivable regardless of colour mode. Nielsen #1 — visibility of system status.

**Fix applied in this run.** Palette entries updated to `dark: 'dark:bg-info-950 dark:text-info-300'`.

### C2 — Badge references non-existent `information-` color scale

**File:** `packages/shared/src/design-system/components/Badge.tsx:24,35,35`
**Variants:** `ready`, `part`, `port`

Values `information-500/10` and `information-700` reference a color scale that does not exist in theme.css. No `--color-information-*` custom properties are defined. This means these badges fall back to the `:unknown` fallback class (`bg-neutral-400/10 text-neutral-600`), losing their semantic colour.

**Same bug in duplicate local Badge:** `apps/frontend/src/views/ArtifactViewer/index.tsx:47,58-59` — three badge entries use `information-`.

**Design lens:** Recognition over Recall — semantic colours should communicate meaning at a glance. Broken colour mapping violates this.

**Fix applied in this run.** `information-` → `info-` in palette (matches `--color-info-*` in theme.css).

---

## HIGH (child issue — THE-144)

### H1 — Duplicate Badge implementation in ArtifactViewer

**File:** `apps/frontend/src/views/ArtifactViewer/index.tsx:16-83`
**Component:** Local `Badge()` function and `getBadgeClasses()` with `BADGE_VARIANTS` set

The shared `Badge` component is already exported from `@nexus-engineering/shared`. This file duplicates it with hardcoded class strings. The local copy has diverged:
- No dark mode classes for any badge variant (unlike shared Badge)
- Uses `!important` overrides for category-based colour shifting
- Has `information-` typo (C2)
- No WCAG `aria-label` propagation (shared Badge passes `...rest`)

**Design lens:** DRY / Occam's Razor — two copies of the same pattern will inevitably diverge. Tesler's Law — complexity should not be duplicated.

**Recommendation:** Import shared `Badge` component and pass category as a `variant` extension or wrapping component. Remove local copy.

---

### H2 — Logo text uses hardcoded `text-white` instead of semantic token

**File:** `apps/frontend/src/App.tsx:69`
```jsx
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-white">
```

The primary-500 background has white text hardcoded. In dark mode, `bg-primary-500` changes from `#3B82F6` to `#3B82F6` (same blue), but `text-white` on this background is only 4.0:1 contrast — borderline AA for normal text. Should use `text-text-inverse` semantic token to allow future palette changes.

**Design lens:** Aesthetic-Usability Effect — visual consistency builds trust. Semantic tokens exist for this purpose.

**Recommendation:** Replace `text-white` with `text-text-inverse`.

---

### H3 — `.dark body` uses hardcoded `text-neutral-50` instead of `text-text-primary`

**File:** `apps/frontend/src/index.css:17-19`
```css
.dark body {
  @apply bg-surface text-neutral-50;
}
```

Should use `text-text-primary` semantic token for consistency with the rest of the dark-mode token chain.

---

## MEDIUM (child issue — THE-145)

### M1 — Ghost button hover/active has no dark-mode override

**File:** `packages/shared/src/design-system/components/Button.tsx:23`
```js
ghost: 'bg-transparent text-text-secondary hover:bg-surface-tertiary active:bg-surface-secondary disabled:text-text-tertiary',
```

`hover:bg-surface-tertiary` refers to semantic token (good), but on dark mode surface-tertiary (`#334155`) and surface-secondary (`#1E293B`) differ only subtly from surface-primary (`#0F172A`). The hover/active visual feedback is less distinguishable in dark mode.

**Design lens:** Fitts's Law — interactive states must provide clear feedback. WCAG — non-text contrast for interactive elements.

**Recommendation:** Consider adding `dark:hover:bg-surface-secondary dark:active:bg-surface-tertiary` or a border/focus enhancement for dark mode ghost buttons.

---

### M2 — Small button touch target below 44px minimum

**File:** `packages/shared/src/design-system/components/Button.tsx:29`
```js
sm: 'h-8 px-3 text-sm gap-1.5',
```

`h-8` = 32px. WCAG 2.2 and Apple HIG specify minimum 44px touch target. The desktop DS spec cites Fitts's Law min 44px for mobile nav. Small buttons violate this on mobile.

**Design lens:** Fitts's Law — undersized targets increase error rate. Motor accessibility — users with tremors or low vision.

**Recommendation:** Consider whether `sm` needs a mobile min-height override, or document that `sm` buttons should not be used in mobile contexts.

---

### M3 — No `prefers-color-scheme` media query for dark mode

**File:** DESIGN_SYSTEM.md §Accessibility mentions: "Dark mode respects `prefers-color-scheme` when used with system detection."

But no code implements this. The only dark toggle is via `classList.toggle('dark')`. Users who set system dark mode get light mode on first load until they manually toggle.

**Design lens:** Doherty Threshold — friction at startup degrades first impression. Defaults — system default should match user expectation.

**Recommendation:** Add a `useEffect` / media query listener that initialises dark mode from system preference.

---

## LOW (notes)

### L1 — One-off border width `border-b-[3px]` on tabs

**File:** `apps/frontend/src/views/ArtifactViewer/index.tsx:351`
```js
const tabBaseClasses = 'shrink-0 border-b-[3px] px-4 py-3 text-sm...'
```

3px border is not a design token. Tailwind's `border-b-2` (2px) or `border-b-4` (4px) are closer to the design system scale. 3px is an arbitrary one-off.

---

### L2 — Package nested `@import` depends on resolution order

**File:** `apps/frontend/src/index.css:1`
```css
@import '@nexus-engineering/shared/src/design-system/theme.css';
```

This works because bundler resolves it before Tailwind, but it's fragile. The package.json `exports` field for `shared` should expose `theme.css` explicitly.

---

## Passes

The following areas pass compliance:

- **Semantic text tokens** (`text-primary`, `text-secondary`, `text-tertiary`, `text-inverse`) — used consistently across App.tsx, ArtifactViewer, RepositoryTree
- **Semantic surface tokens** (`bg-surface-primary`, `-secondary`, `-tertiary`) — consistent
- **Border token** (`border-border`) — used everywhere
- **Color scales** via `var()` in Tailwind config — all 9 scales (primary, secondary, neutral, success, warning, error, info) properly mapped
- **Typography scale** — xs through 6xl defined in Tailwind config
- **Spacing** — all components use Tailwind spacing scale values (1-16)
- **Dark mode class strategy** — correctly toggled on `<html>`, tokens invert per `.dark` block
- **Tab/keyboard navigation** — ArtifactViewer has full arrow key + Home/End support with `aria-selected`
- **Form accessibility** — Input component has `aria-invalid`, `aria-describedby`, `htmlFor` linking
- **Responsive layout** — Grid uses `sm:grid-cols-1 lg:grid-cols-[1fr_auto]`, detail panel uses mobile overlay pattern

## Child Issues

| ID | Title | Severity | Assignee |
|----|-------|----------|----------|
| THE-144 | Fix duplicate Badge + dark-mode gaps in ArtifactViewer | High | FrontendArchitect |
| THE-145 | Address medium-severity compliance gaps (ghost btn, touch targets, system dark mode) | Medium | FrontendArchitect |
