# THE-244 CTO Diagnosis

## Issue
Frontend build fails because `loader.ts` has a **static top-level import** of `nodeFs` from `fileSystem-node.ts` (line 7). Even though `fileSystem-node.ts` uses dynamic `import('fs/promises')`, TypeScript eagerly resolves all static imports at compile time, causing `TS2307: Cannot find module 'fs/promises'` in the frontend context.

## Required Fix (BackendArchitect)

Replace the static import with a lazy dynamic import, matching the existing `importValidator()` pattern already in the same file.

### Change in `packages/shared/src/features/loader.ts`

**Remove line 7:**
```ts
import { nodeFs } from './fileSystem-node';
```

**Add a lazy getter after line 20:**
```ts
private async getDefaultFs(): Promise<FileSystemAdapter> {
  const { nodeFs } = await import('./fileSystem-node');
  return nodeFs;
}
```

**Update constructor (line 16-19):**
```ts
constructor(fs?: FileSystemAdapter) {
  this.ajv = new Ajv();
  this.fs = fs; // can be undefined at construction
}
```

**Update `findFeatureFiles` and `loadFeatureFile` to lazily resolve fs when `this.fs` is undefined.**

OR simpler — use the same pattern as `importValidator` but for the default fs:

```ts
let defaultFs: FileSystemAdapter | null = null;
async function getDefaultFs(): Promise<FileSystemAdapter> {
  if (!defaultFs) {
    const { nodeFs } = await import('./fileSystem-node');
    defaultFs = nodeFs;
  }
  return defaultFs;
}
```

Then in methods, do `const fs = this.fs ?? await getDefaultFs()` before each use.

## Verification
After fix, frontend build should not fail on `fileSystem-node.ts`:
```
pnpm --filter frontend build
```

Pre-existing errors unrelated to THE-244 scope:
- `client.ts` - `OverviewDataDomainCoverage`, `TraceabilityResult`
- `results/loader.ts` - `fs`, `path`
- `tests/loader.ts` - `fs`, `path`
- `loader.ts:2` - `path`

These require SEPARATE issues.
