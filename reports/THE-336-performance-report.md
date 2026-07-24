# THE-336 Performance Optimization Report

**Issue:** S20-W4: Performance Optimization — page load <2s
**Date:** 2026-07-24
**Status:** Implementation delegated to FrontendArchitect
**Author:** CTO

## Baseline Metrics

| Metric | Value |
|--------|-------|
| JS Bundle Size | 601.11 KB |
| JS Gzip Size | 162.31 KB |
| Build Time | 2.06s |
| Modules Transformed | 2,442 |
| Code Splitting | None (monolithic bundle) |

## Top 3 Bottlenecks

### 1. No Code Splitting (Critical)
- **File:** `apps/frontend/src/App.tsx`
- **Impact:** All 25+ view components are eagerly imported at the top level, bundling every view into a single 601KB JS payload. Users download code for views they never visit.
- **Fix:** Replace eager imports with `React.lazy()` + dynamic `import()` for route-based code splitting. Wrap lazy components in `<Suspense>` with a loading fallback.
- **Expected Impact:** Initial bundle reduction of ~80-90%. Only the active view and shared dependencies load initially.

### 2. Inline SVG Icons Instead of lucide-react (Medium)
- **File:** `apps/frontend/src/App.tsx` (lines 563-634)
- **Impact:** 9 inline SVG icon components (SunIcon, MoonIcon, SendIcon, HeartIcon, TrashIcon, UserIcon, MailIcon, EyeIcon, CheckIcon) are manually defined instead of using `lucide-react`, which is already installed as a dependency. This duplicates icon code and prevents tree-shaking.
- **Fix:** Replace all inline SVG icons with imports from `lucide-react` (e.g., `import { Sun, Moon, Send, Heart, Trash2, User, Mail, Eye, Check } from 'lucide-react'`).
- **Expected Impact:** Tree-shaking eliminates unused icons; reduces App.tsx by ~1.5KB gzipped.

### 3. Heavy Components Bundled Eagerly (Medium)
- **File:** `apps/frontend/src/App.tsx` + individual view components
- **Impact:** Heavy components like `RecommendationsPanel` (824 lines), `MultiRepoDashboard`, and `NLTraceQuery` are loaded eagerly even though they may not be the initial route. `ArtifactViewer` pulls in `d3` as a dependency.
- **Fix:** Code splitting (per bottleneck #1) inherently addresses this. Additionally, consider preloading likely Next routes on nav link hover.
- **Expected Impact:** Per-route bundle sizes drop from 601KB to ~30-80KB per view.

## Implementation Plan

1. **FrontendArchitect** implements `React.lazy()` + `Suspense` wrapper for all route-level components in `App.tsx`
2. **FrontendArchitect** replaces inline SVGs with `lucide-react` imports
3. **FrontendArchitect** adds route-based chunk splitting via Vite's default dynamic import support
4. **UXDesigner** reviews the visual loading states (Suspense fallbacks)
5. **QA** verifies all routes still render correctly and measure bundle sizes
6. **CTO** verifies page load <2s target

## DoD

- [x] Profile page loads and identify top-3 bottlenecks
- [ ] Implement fixes for all 3 bottlenecks
- [ ] Verify page load time <2s
- [ ] Document findings in this report

## Constraints

- Max 3 bottlenecks (scope hard limit)
- No scope expansion beyond these 3 fixes
- If blocked >2 iterations, escalate to CEO