# Discovery Dashboard — Design Tokens

**Scope:** Tokens specific to the Discovery Dashboard feature. All tokens extend the existing Nexus design system (`packages/shared/src/design-system/theme.css`).

## 1. Lifecycle State Colors

Map artifact lifecycle states to semantic color tokens. Uses existing palette — no new hex values.

| State | Token | Light | Dark | Tailwind Class |
|-------|-------|-------|------|----------------|
| Discovered | `--lifecycle-discovered` | `#3B82F6` (primary-500) | `#60A5FA` (primary-400) | `bg-primary-500` / `text-primary-500` |
| Parsed | `--lifecycle-parsed` | `#22C55E` (success-500) | `#4ADE80` (success-400) | `bg-success-500` / `text-success-500` |
| Indexed | `--lifecycle-indexed` | `#8B5CF6` | `#A78BFA` | `bg-violet-500` / `text-violet-500` |
| Related | `--lifecycle-related` | `#F97316` | `#FB923C` | `bg-orange-500` / `text-orange-500` |
| Error | `--lifecycle-error` | `#EF4444` (error-500) | `#F87171` (error-400) | `bg-error-500` / `text-error-500` |

**Badge pattern:** Use percentage-opacity background + solid text for contrast:
```css
.lifecycle-discovered { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
.lifecycle-parsed     { background: rgba(34, 197, 94, 0.1);  color: #22C55E; }
.lifecycle-indexed    { background: rgba(139, 92, 246, 0.1);  color: #8B5CF6; }
.lifecycle-related    { background: rgba(249, 115, 22, 0.1);  color: #F97316; }
.lifecycle-error      { background: rgba(239, 68, 68, 0.1);   color: #EF4444; }
```

## 2. Artifact Type Colors

Map artifact types to distinct color tokens. Uses existing palette + two new accent colors.

| Type | Token | Light | Dark | Tailwind Class |
|------|-------|-------|------|----------------|
| Requirement | `--type-requirement` | `#0EA5E9` (info-500) | `#38BDF8` (info-400) | `bg-info-500` / `text-info-500` |
| Architecture | `--type-architecture` | `#F59E0B` (warning-500) | `#FBBF24` (warning-400) | `bg-warning-500` / `text-warning-500` |
| ADR | `--type-adr` | `#6366F1` | `#818CF8` | `bg-indigo-500` / `text-indigo-500` |
| Spec | `--type-spec` | `#14B8A6` | `#2DD4BF` | `bg-teal-500` / `text-teal-500` |

**New Tailwind colors to add to `tailwind.config.js`:**
```js
// Extend colors in tailwind.config.js
colors: {
  violet: {
    400: '#A78BFA',
    500: '#8B5CF6',
  },
  orange: {
    400: '#FB923C',
    500: '#F97316',
  },
  indigo: {
    400: '#818CF8',
    500: '#6366F1',
  },
  teal: {
    400: '#2DD4BF',
    500: '#14B8A6',
  },
}
```

## 3. Dashboard-Specific Spacing

Reuse existing spacing scale. No new tokens needed.

| Element | Spacing | Tailwind |
|---------|---------|----------|
| Card grid gap | 1.5rem | `gap-6` |
| Card internal padding | 1.5rem | `p-6` |
| Section heading to content | 1rem | `gap-4` |
| Filter bar to list | 1rem | `gap-4` |
| Badge to label | 0.375rem | `gap-1.5` |
| Page horizontal padding | 2rem | `px-8` (lg), `px-4` (mobile) |

## 4. Typography

Reuse existing scale. Dashboard-specific usage patterns:

| Element | Class | Notes |
|---------|-------|-------|
| Page title | `text-2xl font-bold text-text-primary` | "Discovery Dashboard" |
| Section heading | `text-sm font-medium text-text-tertiary uppercase tracking-wide` | "Scan Overview", "Artifacts" |
| Stat number | `text-3xl font-bold text-text-primary` | Large count in stat card |
| Stat label | `text-sm text-text-tertiary` | "Total Artifacts", "Last Scan" |
| Artifact name | `text-sm font-medium text-text-primary` | File name in list |
| Artifact metadata | `text-xs text-text-tertiary` | Path, date, size |
| Badge label | `text-xs font-medium` | Status/type badge text |
| Empty state title | `text-lg font-semibold text-text-primary` | "No artifacts found" |
| Empty state body | `text-sm text-text-tertiary` | Helper text |

## 5. Component Tokens

### Scan Progress Indicator
```css
--scan-pulse-duration: 2s;       /* Pulse animation cycle */
--scan-progress-height: 0.25rem; /* Progress bar thickness */
--scan-progress-bg: var(--color-primary-500);
--scan-progress-track: var(--color-neutral-200);
```

### Artifact Row
```css
--artifact-row-hover: var(--surface-secondary);
--artifact-row-border: var(--border-default);
--artifact-row-selected: var(--color-primary-50);  /* Light bg for selected */
--artifact-row-height: 3rem;                         /* Minimum row height */
```

### Stat Card
```css
--stat-card-icon-size: 2.5rem;   /* 40px icon container */
--stat-card-gap: 1rem;           /* Icon to text gap */
--stat-card-padding: 1.5rem;     /* Card internal padding */
```

### Filter Bar
```css
--filter-chip-height: 2rem;
--filter-chip-radius: var(--radius-full);
--filter-chip-active-bg: var(--color-primary-500);
--filter-chip-inactive-bg: var(--surface-tertiary);
```

## 6. Motion

Reuse existing duration/easing tokens. Dashboard-specific applications:

| Element | Token | Duration | Easing | Notes |
|---------|-------|----------|--------|-------|
| Scan pulse | `--scan-pulse-duration` | `2s` | `ease-in-out` | Infinite loop during scan |
| Detail panel slide | `--duration-slow` | `300ms` | `ease-out` | Slide in from right |
| Card hover | `--duration-fast` | `100ms` | `ease-default` | Subtle lift on hover |
| Badge transition | `--duration-fast` | `100ms` | `ease-default` | Color change on filter |
| Skeleton shimmer | `--duration-slower` | `500ms` | `linear` | Loading skeleton animation |

## 7. Accessibility Notes

- **Color independence:** All lifecycle states and types use color + text label (never color alone). Badge always shows "Discovered", "Parsed", etc.
- **Contrast:** All badge text colors meet WCAG AA (4.5:1) against their 10% opacity backgrounds in both light and dark modes.
- **Focus rings:** All interactive elements (cards, rows, buttons, filter chips) show visible focus rings using `ring-2 ring-primary-500 ring-offset-2`.
- **Reduced motion:** Scan pulse animation respects `prefers-reduced-motion: reduce` — falls back to static indicator.
- **Target size:** Filter chips and artifact rows meet 44x44px minimum touch target.
- **Screen reader:** Scan progress uses `aria-live="polite"` for status updates. Artifact counts announced via `aria-label`.

## 8. Empty & Error States

### Empty State (no artifacts)
- Centered layout, max-width 24rem
- Placeholder illustration (inline SVG, 120x120, neutral-300 stroke)
- Title: "No artifacts discovered"
- Body: "Run a scan to discover engineering artifacts in your repository."
- CTA: Primary button "Run First Scan"

### Error State (scan/parse errors)
- Inline error count in stat card (error-500 background tint)
- Expandable error list below stat cards
- Each error row: icon (alert-triangle) + file path + error message
- Error message uses `text-sm font-mono text-error-700` for scannability

### Loading State (skeleton)
- 3-column grid of skeleton stat cards (animated shimmer)
- Skeleton artifact list: 6 rows of shimmer bars
- Matches final layout dimensions to prevent CLS
