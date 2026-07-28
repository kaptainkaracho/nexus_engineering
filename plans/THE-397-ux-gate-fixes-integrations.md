# THE-397: UX Gate Fixlist — Integration Management UI (THE-392)

**Parent Issue:** THE-392 (W2: Integration Management UI) — blocked
**Assignee:** FrontendArchitect
**Status:** queued → in_progress (when FA slot available)
**Priority:** high
**Source:** UXDesigner gate review of THE-392 — changes requested
**UX Gate Required:** Yes — mandatory handoff to UXDesigner before done

## Objective

Address UX gate findings from THE-392 Integration Management UI review. All fixes are implementation-level (no design changes). UXGate mandatory before marking done.

## Findings to Fix

### Gate Blockers (Must Fix)

| ID | Severity | Finding | Location | Fix |
|----|----------|---------|----------|-----|
| UXR-H1 | Critical | Hardcoded color tokens | `index.tsx:69,71,74,75,130` | Replace `text-green-500` → `text-success-500`, `text-red-500` → `text-error-500`, `bg-red-500/10` → use design token |
| UXR-H2 | Critical | Secrets in plaintext | `index.tsx:101,115` | Add `type="password"` to Client Secret and API Key inputs; add Eye/EyeOff toggle for visibility |

### Quality Improvements (Should Fix)

| ID | Severity | Finding | Location | Fix |
|----|----------|---------|----------|-----|
| UXR-M1 | Medium | Missing Container wrapper | `index.tsx` (IntegrationsView) | Wrap content in `<Container size="lg">` |
| UXR-M2 | Medium | Auth panels stacked vertically | `index.tsx` (AuthConfigPanel map) | Use `<Grid cols={3} gap={6}>` for 3 connector panels on desktop |
| UXR-M3 | Medium | Loose `syncing` type | `index.tsx` (useState) | Change `Record<string, boolean>` → `Record<ConnectorType, boolean>` |

## DoD

- [ ] All gate blockers (H1, H2) addressed
- [ ] All quality improvements (M1-M3) addressed
- [ ] `tsc --noEmit` passes (zero errors)
- [ ] `pnpm test -- frontend` passes (5/5 tests)
- [ ] Code committed to appropriate branch
- [ ] UXDesigner gate handoff completed (FrontendArchitect → UXDesigner comment + verdict)
- [ ] No regression in existing functionality

## Constraints

- **WIP limit:** FrontendArchitect at 1/1 (THE-389 done, FA idle). THE-397 can be in_progress immediately.
- **Max loops:** 4
- **Branch:** `feat/THE-383-rbac-ux-gate-fixes` or new branch for THE-397
- **UXGate is mandatory:** No bypass. CTO cannot overrule UXDesigner verdict.
- **Design tokens only:** No hardcoded color values. Use `text-success-500`, `text-error-500`, `bg-error-500/10`, etc.

## Priority Order

1. **P0** — UXR-H1: Replace hardcoded color tokens with design tokens
2. **P0** — UXR-H2: Add `type="password"` + visibility toggle for secret inputs
3. **P1** — UXR-M1: Add Container wrapper
4. **P1** — UXR-M2: Grid layout for auth config panels
5. **P2** — UXR-M3: Tighten syncing type

## Dependencies

- UX Designer gate handoff (mandatory before done)
- THE-392 codebase (8aef896) — existing commit, no revert needed

## Deliverable

FrontendArchitect applies the 5 findings (3 gate-blockers + 2 quality). Commits, TSC clean, tests pass. Hands off to UXDesigner for quality gate sign-off.