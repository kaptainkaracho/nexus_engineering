# THE-338: UX Specification — Bundle Splitting & Page Load Performance

**Issue:** S20-W4a: Frontend Performance — Bundle Splitting & Page Load
**Author:** UXDesigner
**Date:** 2026-07-24
**Status:** Spec complete, awaiting FrontendArchitect implementation

---

## 1. Problem Statement (UX Perspective)

Current state: A single monolithic bundle (~601KB JS) loads every view component regardless of which page the user visits. When a non-admin user lands on the Overview page, they download code for Audit Log, SSO Settings, Org Admin, Trace Gate, and all other admin-only views. This violates **Progressive Disclosure** and inflates Time-to-Interactive for all users.

**UX Impact:**
- First Contentful Paint is delayed by ~1.5-2s on 3G connections (Doherty Threshold: <400ms for perceived instantaneity)
- Mobile users on constrained networks face 3-5s load times
- No loading feedback during lazy transitions — the screen freezes without indication
- **Cognitive Load**: The navigation menu has 27 items with no grouping (Hick's Law)

---

## 2. Loading State Design

### 2.1 Primary Loading Pattern: Skeleton Screens

**Decision:** Use skeleton screens (not spinners) for view-level lazy loading.

**Rationale:**
- **Perceived Performance**: Skeletons show layout structure, reducing uncertainty about what's loading (Doherty Threshold)
- **Progressive Disclosure**: Users see the page frame immediately, content fades in — this is the pattern users expect (Jakob's Law)
- **Reduced Layout Shift**: Skeletons occupy the same space as real content, preventing CLS (Cumulative Layout Shift)

**Skeleton spec:**
- **Duration**: 200-400ms for in-view navigation (same tab, different section)
- **Duration**: 400-800ms for cross-group navigation (admin → non-admin sections)
- **Animation**: Shimmer effect at `transitionDuration.slow` (300ms) with `ease-out` timing
- **Color**: `surface-tertiary` background with `surface-secondary` shimmer
- **Fallback**: If skeleton implementation is complex, use a minimal centered spinner with text label ("Loading...") as a temporary fallback — but this is not the preferred pattern

### 2.2 Skeleton Examples by View Type

| View Type | Skeleton Pattern |
|-----------|-----------------|
| Dashboard (Grid layout) | Grid of rectangular blocks matching the card layout |
| List/Table (Repository, Audit Log) | Horizontal bars simulating table rows |
| Form (SSO, Org Admin) | Vertical blocks matching field heights |
| Chart (Trace Graph, Quality Dashboard) | Container outline with placeholder |
| Navigation (Overview/Landing) | No skeleton — these load synchronously |

### 2.3 Transition Feedback

When navigating between views:
1. **Frame 0ms**: Navigation click → nav item active state changes immediately (visual feedback, <16ms)
2. **Frame 100ms**: Skeleton screen appears (Doherty Threshold: <400ms feedback)
3. **Frame 200-800ms**: Content loads → skeleton fades out, content fades in (CSS transition, 200ms)
4. **Content ready**: Fully rendered view is visible

**Key principle**: The user always sees *something* changing. Never a blank screen.

---

## 3. Route Prioritization & Chunking Strategy

### 3.1 Synchronous (Always Loaded)

These are the critical path — must load immediately:
- `LandingPage` — first screen for all visitors
- `AuthPage` — login/register (authentication is always critical)
- `OnboardingFlow` — new user journey
- `Overview` — default authenticated view
- `Buttons`, `Forms`, `Cards` — design system showcase (always in default view)

**Rationale**: These are the first 5 screens every user sees. Loading them synchronously ensures <200ms first paint.

### 3.2 Priority-1 Lazy (Prefetch on Nav Hover)

Load on-demand, prefetch when user hovers nav item:
- `ArtifactViewer` — most frequently visited data view
- `RepositoryTree` — core workflow
- `DiscoveryDashboard` — primary dashboard
- `MultiRepoDashboard` — primary dashboard
- `FeatureBrowser` — core feature exploration

**Rationale**: These are the most-visited views (Jakob's Law — users gravitate toward familiar patterns). Prefetching on hover makes them feel instantaneous.

### 3.3 Priority-2 Lazy (No Prefetch)

Load on-demand only:
- `GraphBuilder` — heavy d3 dependency
- `Templates` — power-user feature
- `TraceGraph` — heavy d3 dependency
- `ImpactAnalysis` — complex computation
- `ImpactReport` — complex computation
- `RecommendationsPanel` — 824 lines, heavy
- `NLTraceQuery` — AI-powered, inherently slower
- `QualityDashboard` — data-heavy
- `TestResultsDashboard` — specialized

### 3.4 Priority-3 Lazy (Admin-Only, Auth-Gated)

Load on-demand, only when admin user navigates there:
- `AdminDashboard`
- `RoleManagement`
- `AuditLogViewer`
- `PrivateRegistries`
- `TacViewer`
- `SSOSettings`
- `OrgAdmin`
- `GateConfigPanel`

**Rationale**: Non-admin users should never download admin code. Admin users only load what they need.

---

## 4. Prefetch Strategy

### 4.1 Nav Hover Prefetch

For Priority-1 views, trigger prefetch when:
- User's cursor hovers over the nav item for >150ms (debounced)
- Nav item is in the visible viewport (not collapsed in mobile hamburger)

**Implementation**: Use `import()` with a 150ms debounce on `mouseenter`. Do NOT prefetch Priority-2 or Priority-3 views.

### 4.2 Predictive Prefetch (Optional, Future)

After a view loads completely, prefetch its most-likely sibling view:
- From `RepositoryTree` → prefetch `ArtifactViewer` (users typically navigate between these)
- From `DiscoveryDashboard` → prefetch `MultiRepoDashboard`
- From `TraceGraph` → prefetch `ImpactAnalysis`

This is a nice-to-have, not required for THE-338.

---

## 5. UX Quality Gate Criteria

### 5.1 Loading State Requirements (PASS/FAIL)

| Criterion | Pass Condition |
|-----------|---------------|
| No blank screens during transitions | Every navigation shows skeleton or spinner |
| Skeleton matches content layout | Skeleton width/height/position approximates real content |
| No layout shift after load | CLS < 0.1 per navigation |
| Skeleton fades, not snaps | Content transition uses CSS transition (≥150ms duration) |
| Active nav state changes immediately | Nav highlight updates <16ms after click |

### 5.2 Bundle Size Requirements

| Metric | Target |
|--------|--------|
| Initial JS bundle (sync views only) | <150KB gzipped |
| Largest lazy chunk | <100KB gzipped |
| d3 chunk (if separate) | <80KB gzipped |
| Total unique chunks | ≤15 chunks |

### 5.3 Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint (Overview) | <500ms on 3G simulated |
| Time to Interactive (Overview) | <1000ms on 3G simulated |
| Navigation to first paint (lazy view) | <800ms on 3G (with prefetch) |
| Navigation to first paint (lazy view, no prefetch) | <1500ms on 3G |

### 5.4 Accessibility Requirements

| Criterion | Pass Condition |
|-----------|---------------|
| Skeleton screens have ARIA role | `role="status"` with `aria-live="polite"` |
| Loading state is keyboard accessible | Tab order preserved during loading |
| Focus management on load | Focus moves to loaded content (not stuck on nav) |
| Reduced motion respected | Skeleton shimmer respects `prefers-reduced-motion` |

---

## 6. Implementation Handoff for FrontendArchitect

### 6.1 Changes Required

**File: `apps/frontend/src/App.tsx`**

1. Replace all 25+ eager `import` statements with `React.lazy()` dynamic imports organized by priority tier (Section 3 above).

2. Add a `RouteLoadingSkeleton` component that:
   - Accepts a `variant` prop: `"grid" | "table" | "form" | "chart" | "default"`
   - Renders skeleton rectangles matching the expected layout
   - Uses `transitionDuration.slow` (300ms) shimmer animation
   - Has `role="status" aria-live="polite"`
   - Respects `prefers-reduced-motion` (no shimmer, instant show)

3. Wrap the route render in a `<Suspense fallback={<RouteLoadingSkeleton variant={...} />}>`

4. Keep `LandingPage`, `AuthPage`, `OnboardingFlow`, `Overview`, and design system showcase views as synchronous imports.

5. Implement hover-based prefetch for Priority-1 nav items (150ms debounce on `mouseenter`).

6. Replace all 9 inline SVG icons with `lucide-react` imports (per THE-336 finding).

**File: `apps/frontend/vite.config.ts`**

1. Add `build.rollupOptions.output.manualChunks` to split:
   - `react-vendor`: react, react-dom, react-router (if used)
   - `d3-vendor`: d3 library
   - `lucide-vendor`: lucide-react icons
   - `app`: remaining application code

### 6.2 Design Tokens to Use

- Skeleton background: `bg-surface-tertiary`
- Skeleton shimmer: `bg-surface-secondary` with opacity animation
- Skeleton border-radius: `rounded` (0.5rem / DEFAULT)
- Transition duration: `transitionDuration.slow` (300ms)
- Transition timing: `transitionTimingFunction.out`
- Text color for "Loading..." label: `text-text-tertiary`
- Font: `text-sm font-medium text-text-tertiary`

### 6.3 What NOT to Change

- No changes to view component internals (that's Wave 1a)
- No changes to Tailwind config or design tokens
- No changes to existing view behavior or data fetching
- No changes to auth flow logic
- No changes to CSS beyond skeleton loading states

---

## 7. Visual-Truth Gate for Review

When FrontendArchitect completes implementation, UXDesigner will verify:

1. **Render at 1440x900 desktop and 390x844 mobile**
2. **Verify these states:**
   - Landing page loads correctly (no skeleton, immediate render)
   - Auth flow works (login, register, forgot-password)
   - Overview page loads immediately (synchronous)
   - Each Priority-1 view shows skeleton during load, then fades in
   - Each Priority-2 view shows skeleton during load, then fades in
   - Each Priority-3 view shows skeleton during load, then fades in
   - Non-admin user never sees admin nav items
   - Mobile hamburger menu works correctly
   - Dark mode skeleton rendering (skeletons visible in both themes)
   - `prefers-reduced-motion` — skeletons show instantly, no shimmer
3. **Capture screenshots** at both viewports for each lazy-loaded view
4. **Verdict:** Approve or request changes with specific viewport observations

---

## 8. Residual Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Skeleton mismatch with real content layout | Medium | FrontendArchitect should reference real view layouts when building skeleton variants |
| Prefetch causes too many concurrent requests | Low | Debounce at 150ms; cancel stale prefetches on route change |
| Auth-gated routes prefetch before auth resolves | Medium | Only prefetch after auth is confirmed; check `user` state before triggering |
| Skeleton adds visual complexity during Wave 1a polish | Low | Skeletons use generic shapes; Wave 1a polish will refine if needed |

---

*This spec is the UX authority for THE-338. Any implementation that removes loading states, shows blank screens during navigation, or eliminates skeleton feedback does not meet UX requirements and will fail the UX Gate.*
