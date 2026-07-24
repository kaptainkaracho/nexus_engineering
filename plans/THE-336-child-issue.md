# THE-336 Child Issue: Frontend Architect — Code Splitting & Bundle Optimization

**Parent Issue:** THE-336 (S20-W4: Performance Optimization — page load <2s)
**Assignee:** FrontendArchitect
**Priority:** high (CEO override directive)
**Status:** ready for execution

## Objective
Implement code splitting, lazy loading, and bundle optimization to achieve page load <2s.

## Bottlenecks to Fix

### 1. No Code Splitting (Critical)
- **Target:** `apps/frontend/src/App.tsx` lines 1-27 (eager imports)
- **Action:** Replace all 25+ eager view imports with `React.lazy()` + dynamic `import()`
- **Action:** Add `<Suspense fallback={<LoadingSpinner />}>` wrapper around lazy route rendering
- **Action:** Keep `ProtectedLayout`, `isAdmin`, `AuthPage` as synchronous (auth is critical path)
- **Action:** Implement hash-based route-to-lazy-component mapping

### 2. Inline SVG Icons (Medium)
- **Target:** `apps/frontend/src/App.tsx` lines 563-634 (9 inline SVG components)
- **Action:** Replace all inline SVG icons with imports from `lucide-react` (already installed)
- **Specific replacements:** Sun → Sun, Moon → Moon, Send → Send, Heart → Heart, Trash → Trash2, User → User, Mail → Mail, Eye → Eye, Check → Check
- **Action:** Remove the 9 inline icon function definitions

### 3. Vite Chunk Optimization (Medium)
- **Target:** `apps/frontend/vite.config.ts`
- **Action:** Add `build.rollupOptions.output.manualChunks` to split vendor chunks (react, d3, lucide-react) from app code
- **Action:** Add bundle analysis for verification

## Implementation Steps (Sequential)

1. Replace eager imports in App.tsx with React.lazy() calls
2. Add Suspense boundary with LoadingSpinner fallback
3. Replace inline SVG icons with lucide-react imports
4. Configure Vite manual chunk splitting
5. Run `pnpm build` and verify typecheck passes
6. Run `pnpm lint` and fix any issues
7. Run `pnpm test` and `pnpm test:e2e` to verify no regressions
8. Run Lighthouse audit to confirm <2s page load

## DoD
- [ ] Build passes typecheck + lint
- [ ] All routes render correctly with lazy loading
- [ ] Bundle size reduced (verify via `pnpm build` output)
- [ ] No regressions in E2E tests
- [ ] Lighthouse page load <2s
- [ ] UXDesigner gate handoff completed (frontend changes)
- [ ] QA verification completed

## Constraints
- Max 3 bottlenecks (scope hard limit)
- CEO override — execute immediately
- UXDesigner gate required before marking done
- FrontendArchitect has THE-326 in_review (not in_progress), so available

## Delegation Note
This is a CEO override directive. FrontendArchitect should prioritize this over THE-326 review completion.
The UXDesigner gate is mandatory — do not mark done without UXDesigner sign-off.