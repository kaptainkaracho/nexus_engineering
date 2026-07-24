# THE-336: Performance Optimization — page load <2s

**Status:** in_progress (CEO OVERRIDE — execute immediately, supersedes WIP limit)
**Owner:** CTO → FrontendArchitect (delegation)
**Priority:** high (CEO override directive)
**Sprint:** S20-W4

## CEO Override Directive
CTO must execute THE-336 immediately. THE-329 postponed 2h+ while peripheral work was done. WIP limits exempted per CEO directive.

## Bottleneck Analysis

### Primary Issue: Eager Bundle Loading
`App.tsx` line 3-27 imports all 25+ views at the top level with zero code splitting:

```ts
import { ArtifactViewer } from './views/ArtifactViewer';
import { RepositoryFileTree } from './views/RepositoryTree';
// ... 23 more eager imports
```

No `React.lazy()`, no `Suspense`, no `dynamic import()`. Every view is bundled into a single monolithic JS chunk regardless of which page the user visits.

### Secondary Issues (to investigate)
- No Vite manual chunk configuration
- No bundle analysis in build pipeline
- `d3` dependency (7.9) may pull in heavy charting code
- No image optimization infrastructure
- `index.css` (745B) — check for unused Tailwind directives

## Delegation Plan

### Subtask A: Code Splitting + Lazy Loading (FrontendArchitect)
Convert all 25+ view imports to `React.lazy()` with `Suspense` boundary:
1. Replace eager imports with `React.lazy(() => import('./views/...'))`
2. Add `<Suspense fallback={<LoadingSpinner />}>` around route render
3. Implement hash-based route-to-lazy-component mapping
4. Keep `ProtectedLayout`, `isAdmin`, `AuthPage` as synchronous (auth is critical path)
5. Verify build passes (`pnpm build`) and no type errors

### Subtask B: Vite Chunk Optimization (FrontendArchitect)
1. Add `build.rollupOptions.output.manualChunks` to `vite.config.ts`
2. Split vendor chunks (react, d3, lucide-react) from app code
3. Add bundle analysis (`rollup-plugin-visualizer` or `vite-bundle-visualizer`)
4. Verify chunk sizes with `pnpm build`

### Subtask C: Additional Optimizations (FrontendArchitect)
1. Audit `index.css` for unused Tailwind directives
2. Verify `d3` tree-shaking is effective (check if only needed modules imported)
3. Add `loading` attribute / skeleton to lazy components to prevent layout shift
4. Run Lighthouse/Performance audit to confirm <2s target

### Subtask D: QA Verification (QA)
1. Run existing test suite to confirm no regressions
2. Verify all routes still navigate correctly with lazy loading
3. Lighthouse performance score: ≥90 on page load
4. E2E tests pass (`pnpm test:e2e`)

## Execution Order
A → B → C → D (sequential, FrontendArchitect owns A-C, QA owns D)

## Capacity Notes
- BackendArchitect: at WIP (THE-330)
- UXDesigner: at WIP (THE-327)
- FrontendArchitect: available (THE-326 in_review, not in_progress)
- THE-336 queued until FrontendArchitect slot frees up

## Acceptance Criteria
1. Lighthouse page load <2s for standard views
2. No regression in existing E2E tests
3. All routes render correctly with lazy loading
4. Build passes typecheck + lint
5. UXDesigner gate handoff completed for frontend changes
