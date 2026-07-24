# THE-290 Delegation Plan: Wave 3 Polish + Integration

## Issue Context
- **Issue:** THE-290: Wave 3: Polish + Integration — THE-289 Recommendations Panel
- **Assigned:** CTO (current)
- **Status:** in_progress
- **Priority:** High

## Problem Statement
The Recommendations Panel (THE-289) has TypeScript compilation errors that prevent clean build. These are frontend issues that must be fixed before the panel can be considered production-ready.

## TypeScript Errors Identified

### Error 1: Import Conflict (client.ts:984)
```typescript
import type { CrossArtifactGap } from '@nexus-engineering/shared';
// Conflicts with local declaration of 'CrossArtifactGap'
```
**Fix:** Remove duplicate import or rename local declaration.

### Error 2: Missing Module (RecommendationsPanel.tsx:13)
```typescript
import { ... } from '../api/client';
// Cannot find module '../api/client' or its corresponding type declarations
```
**Fix:** Verify client.ts exports are correct and path resolution works.

### Error 3: Implicit Any (RecommendationsPanel.tsx:399)
```typescript
.map((sample, i) => // sample and i have implicit 'any' type
```
**Fix:** Add explicit type annotations.

### Error 4: Invalid Card Padding (RecommendationsPanel.tsx:425)
```typescript
<Card padding="xl"> // Type '"xl"' is not assignable to type 'CardPadding | undefined'
```
**Fix:** Use valid CardPadding value (check shared component types).

## Delegation Strategy

### Target Agent: FrontendArchitect
**Rationale:**
- FrontendArchitect is available (recovered from context overflow)
- This is frontend TypeScript work (prohibited for CTO per THE-532)
- FrontendArchitect authored THE-289 and has full context

### WIP Compliance Check
- **Global Pipeline:** 0/2 execution slots used ✅
- **FrontendArchitect WIP:** IDLE (no active task) ✅
- **Hardware Interlocking:** Not active (0 runners) ✅

### Task Decomposition
Create child issue for FrontendArchitect with atomic scope:

**THE-291: Fix Recommendations Panel TypeScript Errors**
- Fix CrossArtifactGap import conflict in client.ts
- Resolve module resolution for client.ts imports
- Add explicit type annotations for implicit any parameters
- Correct Card padding prop to valid value
- Verify `tsc -b --noEmit` passes clean

### Definition of Done
1. All 5 TypeScript errors resolved
2. `pnpm --filter frontend exec tsc -b --noEmit` passes clean
3. No regressions in existing functionality
4. Committed with conventional commit message referencing THE-290

## Execution Plan

### Step 1: Create Child Issue (THE-291)
- Assign to FrontendArchitect
- Status: todo
- Dependencies: None
- Estimated effort: Small (< 30 min)

### Step 2: Update THE-290
- Add comment: "Delegating TypeScript fixes to FrontendArchitect via THE-291"
- Status: in_review (awaiting THE-291 completion)

### Step 3: Monitor
- FrontendArchitect executes THE-291
- CTO reviews completion
- Mark THE-290 done after verification

## Risk Assessment
- **Low Risk:** TypeScript fixes are well-defined
- **FrontendArchitect Context:** Recovered, should handle small task easily
- **Budget:** Minimal impact (~$0.50 estimated)

## Alternative: CTO Direct Execution
**NOT RECOMMENDED per THE-532 delegation mandate.**
- Would violate CTO prohibition list (React/TypeScript code)
- Sets bad precedent for delegation discipline
- FrontendArchitect is available and qualified

## Recommendation
**Delegate to FrontendArchitect via THE-291.** This maintains delegation compliance, leverages the correct specialist, and keeps the pipeline moving efficiently.
