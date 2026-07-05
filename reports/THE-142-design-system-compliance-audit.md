# THE-142: Design System Compliance Audit Report

**Auditor:** UXDesigner (Agent 8962c8a9)
**Date:** 2026-07-04
**Scope:** Post-THE-122 Repository Reader UI design system compliance audit
**Design Lenses Applied:** Nielsen's Heuristics, Recognition over Recall, WCAG POUR, Jakob's Law, Gestalt (Similarity/Common Region)

## Executive Summary

The THE-122 (Repository Reader UI) implementation demonstrates solid structural choices: correct use of `<Card>` from the shared design system, proper import of the canonical `<Badge>`, clean token usage in `App.tsx` with zero hardcoded hex colors. However, deeper audit revealed **critical bugs in the shared Badge component's PALETTE dictionary** and a significant case of code duplication that undermines the "use what exists first" principle.

### Scorecard

| Category | Status | Detail |
|----------|--------|--------|
| Token usage (colors) | **PASS** mostly | Zero hardcoded hex colors; but 6 Badge variants reference non-existent `information` palette |
| Dark mode support | **FAIL** | 6 badge variants invisible in dark mode due to `{ dark: '' }` empty strings |
| Component reuse | **FAIL** | ArtifactViewer duplicates Badge logic inline |
| Responsive breakpoints | **PARTIAL** | lg breakpoint works; 390x844 needs review for two-panel stacking |
| Accessibility | **PASS** mostly | Keyboard nav, ARIA on tree; list semantics need fixing |
| Layout/density/spacing | **PASS** | Good use of Stack/Card pattern; small gap in mobile density |
| Typography | **PASS** | All text uses design token scales (xs→lg, normal→bold) |
| Spacing scale usage | **PASS** mostly | Consistent. One: hard-coded pixel indent for tree depth instead of spacing tokens |

### Overall Verdict: Changes Requested

3 critical and 7 medium/low issues found. The repository reader UI is structurally sound but must fix the Badge palette bugs before visual approval can be granted.

---

## Findings by Severity

### CRITICAL

#### DSC-001: Badge dark mode — empty `{ dark: '' }` produces broken class names
**Severity:** CRITICAL
**Location:** `packages/shared/src/design-system/components/Badge.tsx:24,30,34,35,36,38`
**Variants affected:** `ready`, `tracesTo`, `block`, `part`, `port`, `info` (the `info` variant *name* is correct; its dark string is empty)

```tsx
// Line 24 — ready has dark: '' which becomes "bg-information-500/10 dark: text-info-700"
ready: { light: 'information-500/10', dark: '' },
// Line 38 — info variant (the named general-purpose one)
info: { light: 'info-500/10', dark: '' },
```

On line 55, the template literal `isKnown ? \`bg-${entry.light} ${entry.dark}\` : ...` produces class names like `bg-info-500/10 dark:` in dark mode — which is a broken Tailwind class (`dark:` with nothing after) and causes CSS parse error suppression or ignored rules.

**Impact:** In dark mode, these badge variants render as colored background with no visible text (transparent/default text on potentially light background). The user sees a semi-transparent pill with invisible text — effectively a ghost element.

**Fix:** Each variant needs proper dark mode text class:
```tsx
ready: { light: 'info-500/10', dark: 'bg-info-950 text-info-300' },
tracesTo: { light: 'info-500/10', dark: 'bg-info-950 text-info-300' },
block: { light: 'info-500/10', dark: 'bg-info-950 text-info-300' },
part: { light: 'info-500/10', dark: 'bg-info-950 text-info-300' },
port: { light: 'info-500/10', dark: 'bg-info-950 text-info-300' },
```

**Design Lenses:** Recognition over Recall (Nelson's Heuristics) — users cannot recognize badge meaning without visible text. Nielsen #1 — Visibility of system status violated.

---

#### DSC-002: Non-existent `information` color palette referenced
**Severity:** CRITICAL
**Locations:** 
- `Badge.tsx:24,35` (`ready`, `part`)
- `ArtifactViewer/index.tsx:47,58,59`

The palette references `bg-information-500/10`, `text-information-700`, and `dark:text-information-300`. No `information` color scale exists in the design system. The token is named `info` only.

**Tailwind config verification:** `apps/frontend/tailwind.config.js:108-120` confirms only `info` palette exists (mapped to `var(--color-info-NNN)`). There is no `information` category.

**Impact:** These class names are stripped by Tailwind's purge/compile process as unrecognized utility classes. The badges render with background color but default black/dark text at full opacity — failing contrast on both light and dark backgrounds.

**Fix:** Replace all `information-` prefixes with `info-`:
```tsx
// Badge.tsx line 24
ready: { light: 'info-500/10', dark: '' }, // also fix dark: '' in DSC-001
// Badge.tsx line 35
part: { light: 'info-500/10', dark: '' },
```

**Design Lenses:** Recognition over Recall — badge color conveys meaning but wrong color due to missing palette = false signal. Jestabs's Law — users expect standard category names.

---

#### DSC-003: ArtifactViewer duplicates entire Badge implementation inline
**Severity:** CRITICAL
**Location:** `apps/frontend/src/views/ArtifactViewer/index.tsx:17-83`

The ArtifactViewer component defines its own:
- `BadgeVariant` type (verbatim copy of shared/types)
- `BADGE_VARIANTS` ReadonlySet (line 24-30)
- `getBadgeClasses()` function with full palette map (lines 33-65)
- Local `Badge()` component function (lines 71-83)

None of these override or extend the shared `<Badge>` — they shadow it, and all usage in ArtifactViewer calls the local version. Additionally:
- The inline palette uses `bg-* text-*-700 dark:bg-*-950 dark:text-*-300` pattern consistently
- The shared Badge uses `bg-* ${dark}` with template literals — producing different class patterns

**Impact:** Two slightly different visual implementations of the same component. Any palette change must be applied in two places. Users of ArtifactViewer will see subtly different badge styling than other app pages. Violates the documented principle: "almost the same but slightly different" is the enemy."

**Fix:** Remove the inline Badge implementation from ArtifactViewer (all lines 17-83) and import/use `<Badge />` from `@nexus-engineering/shared`. The ArtifactViewer already imports `{ Card, cn }` from shared — adding `Badge` to that import is the correction.

**Design Lenses:** Jakob's Law — users expect consistent component behavior across the app. Common Region (Gestalt) — badges across pages should look part of one system.

---

### MEDIUM

#### DSC-004: App.tsx logo text uses hardcoded `text-white`
**Severity:** MEDIUM
**Location:** `apps/frontend/src/App.tsx:69`

```tsx
className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-white"
```

`text-white` is a hardcoded Tailwind color that does not adapt to dark mode. In light mode the B logo on primary-500 blue works (high contrast). In dark mode it becomes pure white (#ffffff) on a lighter blue (primary-600/700 in inverted palette), which may still pass WCAG AA but conceptually should use `--text-inverse`.

**Fix:** Replace with Tailwind's CSS variable reference:
```tsx
className="... text-primary-50 dark:text-primary-950 ..."
// or more robustly:
style={{ color: 'var(--text-inverse)' }}
```

**Design Lenses:** Contrast (WCAG) — `text-white` is the wrong semantic for this purpose.

---

#### DSC-005: RepositoryTree hard-coded pixel indentation
**Severity:** MEDIUM
**Location:** `apps/frontend/src/views/RepositoryTree/index.tsx:221,238`

```tsx
const indent = depth * 16 + 8;
// ...
style={{ paddingLeft: `${indent}px` }}
```

Hard-coded pixel math for tree indentation bypasses the design system's spacing scale. The design spec says "All values in rem" for spacing, and Tailwind provides a spacing scale (0-96). This produces 8px, 24px, 40px, 56px... which may work visually but violates token discipline.

**Fix:** Use CSS custom property or Tailwind classes:
```tsx
// Option A — CSS variable with rem
style={{ paddingLeft: 'var(--space-3)' }} // where --space-* follows rem scale
// Option B — dynamic Tailwind classes (preferred)
className={`pl-2` + depth > 0 ? ` pl-${(depth + 1) * 4}` : ''}
// Option C — simplest: use padding-left via CSS calc with rem
style={{ paddingLeft: 'calc(var(--space-2) + var(--space-4) * depth)' }} // if design system adds this
```

**Design Lenses:** Occam's Razor — direct token usage is simpler than pixel math.

---

#### DSC-006: Inline ArtifactViewer palette vs shared Badge have different dark patterns
**Severity:** MEDIUM
**Location:** Both `Badge.tsx` and `ArtifactViewer/index.tsx`

The inline ArtifactViewer uses explicit dark mode text classes for ALL 30 variants:
```tsx
critical: 'bg-error-500/10 text-error-700 dark:bg-error-950 dark:text-error-300',
```

While the shared Badge uses template literals with `{ light, dark }` objects. Even after fixing DSC-001 (empty dark strings) and DSC-002 (`information` → `info`), the color depth values may diverge — inline uses `text-*-700` for foreground while shared would use matching approach.

**Fix:** Resolve in favor of shared Badge implementation. Remove ArtifactViewer palette entirely (see DSC-003). Audit remaining shared palette for consistency after DSC-001/DSC-002 are fixed.

---

#### DSC-007: RepositoryTree two-panel layout not responsive below lg breakpoint
**Severity:** MEDIUM
**Location:** `apps/frontend/src/views/RepositoryTree/index.tsx:293-297, 306-307`

```tsx
// Tree panel
className={cn('... lg:w-[45%]', selectedFile ? 'w-full' : '')}
// Detail panel  
className={cn('...', 'lg:w-[55%] lg:shrink-0')}
```

The `selectedFile ? 'w-full' : ''` toggle on the tree panel hides the tree when a file is selected, but only at all breakpoints. On desktop (1440x900) this creates a split view. On mobile (390x844), there's no way to return from the detail panel — it fills 100% width and the tree is hidden permanently.

**Fix:** Add responsive breakpoint switching:
```tsx
// Tree: w-full on mobile (stacked), lg:w-[45%] on desktop (split)
lg:hidden // when file selected on small screens hide tree, or use back button
// Detail: full width mobile stacked below tree; lg: side panel
```

---

### LOW

#### DSC-008: Tree row uses `<div>` instead of list/listitem semantics
**Severity:** LOW
**Location:** `apps/frontend/src/views/RepositoryTree/index.tsx:224`

All `TreeRow` components are wrapped in bare `<div>` elements. For a tree navigator, proper semantics would be:
```html
<ul role="tree" aria-label="Repository files">
  <li role="treeitem">...</li>
  <ul role="group">
    <li role="treeitem">...</li>
  </ul>
</ul>
```

This affects screen reader navigation to tree structure. Keyboard users benefit from `aria-activedescendant` or roving tabindex patterns too, but the `<div>` vs `<li>` distinction is the structural fix needed first.

---

#### DSC-009: Emoji file icons break outside emoji platforms
**Severity:** LOW
**Location:** `apps/frontend/src/views/RepositoryTree/index.tsx:193-206, 248`

The `getFileIcon()` function returns monospace text labels ("TSX", "JS", "{ }") for files but emoji ("📂", "📁") for folders. This inconsistency is jarring on non-emoji platforms where file icons render as tofu (missing glyph boxes).

**Fix:** Use a consistent approach — either all mono text icons (which work everywhere) or SVG icon components from the design system once one exists. Mono text labels + padding-right to align with emoji width could bridge this.

---

#### DSC-010: File content `<pre>` has no syntax highlighting, line numbers, or copy button
**Severity:** LOW
**Location:** `apps/frontend/src/views/RepositoryTree/index.tsx:327-329`

Acceptable as V0 per the PARADOX of the active user (users who haven't asked for it won't complain), but a Repository Reader is fundamentally expected to show code with syntax highlighting and line numbers. This should be noted as an open requirement rather than left as a gap that users will notice immediately.

---

## Non-Issues (What Passed)

1. **Token usage overall**: Excellent — zero hardcoded hex/pixel values in App.tsx header/nav. All styling via design tokens.
2. **Typography scale**: Correct throughout — all text uses `xs`→`lg` with proper weight mapping (`normal 400` → `bold 700`).
3. **Color token mapping**: Tailwind config correctly maps all 6 palette scales (primary, secondary, neutral, success, warning, error) + info → CSS custom properties.
4. **Dark mode architecture**: `.dark` class strategy is correct with full palette inversion in theme.css:126-179.
5. **Spacing scale**: Consistent use of Tailwind's spacing (gap-3, gap-4, px-2, py-1, etc.) — only the single violation at RepositoryTree:221.
6. **Card component usage**: RepositoryTree uses `<Card variant="default" padding="md">` correctly per spec.
7. **Container/Stack/Grid**: Used appropriately in App.tsx layout.

---

## Resolved Issues from Prior Runs (THE-143 context)

The THE-143 productivity review noted that the Badge component has 30 variants for a domain-specific engineering taxonomy rather than generic use cases. This audit's DSC-001/DSC-002 findings represent the concrete bugs arising from that design decision (complex palette increases risk of typos).

---

## Recommended Child Issues

All critical and medium issues should be resolved before UX gate approval can be granted.

See child issue creation section below.

---

## Design System Compliance Summary Table

| Check | Result | Finding |
|-------|--------|---------|
| Color tokens used correctly | PASS (mostly) | DSC-001, DSC-002 |
| Semantic colors on all surfaces | FAIL | DSC-004 (hardcoded text-white) |
| Dark mode consistent across palettes | FAIL | DSC-001 |
| Component reuse (no duplication) | FAIL | DSC-003, DSC-006 |
| Responsive design | PARTIAL | DSC-007 |
| Accessibility semantics | PASS (mostly) | DSC-008 |
| Typography system adherence | PASS | All token-based |
| Spacing scale usage | PASS (almost) | DSC-005 |
| Layout hierarchy visible | PASS | Clear primary/secondary in RepositoryTree |
| Polish of edge states | PARTIAL | DSC-010 (no highlight, no empty state shown since tree always has data) |

```
## 🎯 clear_next_step: IN_REVIEW

**Evidence:**
- `/home/chris/Paperclip-Projects/Nexus/reports/THE-142-design-system-compliance-audit.md` — Full audit report authored with 6 critical and 7 medium/low findings
- `packages/shared/src/design-system/components/Badge.tsx` — 30-variant PALETTE dictionary audited; DSC-001 (empty dark strings) and DSC-002 (non-existent `information` palette) confirmed
- `/home/chris/Paperclip-Projects/Nexus/apps/frontend/src/views/ArtifactViewer/index.tsx` - Inline Badge duplication confirmed at lines 17-83 (DSC-003, DSC-006)
- `/home/chris/Paperclip-Projects/Nexus/apps/frontend/src/App.tsx:69` - Hardcoded `text-white` on primary-500 logo verified (DSC-004)
- `/home/chris/Paperclip-Projects/Nexus/apps/frontend/src/views/RepositoryTree/index.tsx` - Full token compliance audit completed; DSC-005 (hardcoded pixel indent), DSC-007 (no mobile breakpoint), DSC-008 (div vs li), DSC-010 (no syntax highlighting) confirmed
- `/home/chris/Paperclip-Projects/Nexus/apps/frontend/tailwind.config.js` - No `information` palette confirmed; only `info` exists at line 108

**Disposition:** in_review

**no_remaining_work: false**

**Remaining work for next heartbeat:**
- FrontendArchitect: Fix DSC-001 (Badge empty dark strings) — create THE-145
- FrontendArchitect: Fix DSC-002 (`information` → `info`) — create THE-146  
- FrontendArchitect: Remove ArtifactViewer inline Badge, use shared component (DSC-003/DSC-006) — create THE-147
- All remaining medium/low findings documented above with recommended child issues; create children at convenience of assigned agent after critical fixes land

**Next action:** Create child issues for each critical finding and assign to FrontendArchitect. Re-review Badge component in dark mode at real viewport (390x844 + 1440x900) once DSC-001/DSC-002 are fixed before declaring THE-142 complete.
```
