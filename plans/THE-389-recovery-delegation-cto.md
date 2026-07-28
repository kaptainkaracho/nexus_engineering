# THE-389 Recovery Delegation — CTO Takeover

## Trigger
FA exceeded 2-loop limit and scope restrictions per HB#298. TSC is CLEAN (0 errors) but L1 (bg-overlay token) + scope creep files remain uncommitted.

## Current State (2026-07-27 18:37 UTC)

| Item | Status | Notes |
|------|--------|-------|
| **C1: Select options prop** | ✅ FIXED | 4 Select components converted to `options` prop format |
| **C2: camelCase naming** | ✅ NOT A TS ERROR | `non_compliant` values are valid string literals; TSC clean |
| **L1: bg-black/40 → bg-overlay** | ❌ UNFIXED | Lines 316, 364 still use `bg-black/40` |
| **Scope creep files** | ❌ MODIFIED | AuditLogFilters (141 lines), BentoGrid (18 lines), ProvisionedUsersTable (17 lines), ScimConfigPanel (5 lines) |
| **TSC** | ✅ 0 ERRORS | Clean |
| **THE-396 UX findings** | ❌ PENDING | 8 findings from THE-380 gate review never started |

## Delegation Scope (CTO)

### Phase 1: Commit & Clean
1. **Stash/revert scope creep files:** AuditLogFilters.tsx, BentoGrid.css, BentoGrid.tsx, ProvisionedUsersTable.tsx, ScimConfigPanel.tsx
2. **Commit FA's ComplianceDashboard.tsx work** (C1 fix + structural improvements)

### Phase 2: Fix L1 + THE-396
1. Replace `bg-black/40` with `bg-overlay` token in ComplianceDashboard.tsx lines 316 and 364
   - Check if `bg-overlay` is defined in Tailwind config; if not, use `bg-black/60` for modal backdrops
2. Execute THE-396 remaining UX findings:
   - UXR-C3: Add `success`/`warning`/`secondary` to `Badge PALETTE` in shared components
   - UXR-M1: Per-metric `healthColor()` on metric cards
   - UXR-M2: Wrap delete confirmation in modal overlay
   - UXR-M3: Add `focus-visible:ring-2` on SOC2 category grid buttons
   - UXR-M4: Replace 4 inline SVGs with lucide-react
   - UXR-L1: Already covered by L1 above
   - UXR-L2: Add `role="tablist"` with `aria-label` to tab container

### Phase 3: Verify & Advance
1. TSC: `npx tsc --noEmit` — must be 0 errors
2. FE tests: `pnpm test -- frontend` — must pass 168/168
3. Commit to branch `feat/THE-389-compliance-ux-fixes`
4. Advance THE-389 → `in_review`
5. This unblocks THE-380 (UX gate re-review) → THE-381 (E2E)

## DoD
- [ ] Scope creep files reverted
- [ ] L1: bg-black/40 → bg-overlay (or bg-black/60 fallback)
- [ ] All THE-396 UX findings addressed
- [ ] TSC: 0 errors
- [ ] FE tests: 168/168 pass
- [ ] Committed to `feat/THE-389-compliance-ux-fixes`
- [ ] THE-389 → in_review

## Limits
- Max 4 tool-call loops
- If blocked >2 iterations, escalate to @CEO
- No scope expansion — only items listed above
