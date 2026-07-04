# THE-96: Type System Unification Plan

## Problem

The codebase has ~30+ distinct interface/type definitions across 8+ files with significant duplication and divergence between YAML/JSON serialization types and runtime TypeScript types.

## Divergences Found

### 1. TraceLink Has Three Different Shapes
- **`TraceLink`** (`packages/shared/src/types.ts:87`): canonical, has `sourceId`, `sourceType`, `targetId`, `targetType`, `relationshipType`, `confidence`, extends `BaseEntity`
- **`RequirementTraceLink`** (`types.ts:22`): YAML-embedded form, uses `target: { id, documentId }` instead of flat `targetId`/`targetType`, no `version`/`createdAt`/`updatedAt`/`source`
- **`StoredTraceLink`** (`apps/backend/src/traceabilityLinks/store.ts:5`): all union fields typed as plain `string`, `description` can be `null`, dates are `string`
- **`ArtefactTrace`** (`apps/frontend/src/api/client.ts:60`): `relationshipType: string`, lacks `version`/`createdAt`/`updatedAt`/`source`

### 2. Status Enum Drift
- Canonical `Requirement.status`: `'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified'`
- Frontend `ArtefactRequirement.status`: same **+ `'draft'`** (extra value)

### 3. Date Handling Is Inconsistent
- Core interfaces use `Date` objects
- JSON Schema types use `string` (format: `date-time`)
- Frontend types use `string`
- YAML files use ISO strings
- Backend store converts manually

### 4. JSON Schema Types Are Hand-Maintained Mirrors
- `RequirementSchema`, `ArchitectureModelSchema`, `SoftwareComponentSchema`, `TestCaseSchema`, `TraceLinkSchema` (`types.ts:102-243`) are manually written TS types that mirror interfaces with `string` dates
- `reqDocSchema` in `schema.ts` is yet another hand-written schema

### 5. Frontend Artefact Types Are Subsets/Supersets
- `ArtefactArchitecture` drops `version`, `createdAt`, `updatedAt`, `source` from canonical `ArchitectureModel`
- `ArtefactComponent` drops `version`, `createdAt`, `updatedAt`, `source`, `dependencies`

---

## Proposed Solution

### Strategy: "Canonical Source + Derived Types"

Make `packages/shared/src/types.ts` the single source of truth. All other type definitions must be derived, imported, or explicitly justified.

### Phase 1: Core Type Utilities (`packages/shared/src`)

**Who:** BackendArchitect

Add a `SerializedDate` utility type mechanism to `types.ts`:

```ts
// Add to types.ts
export type IsoDateString = string;
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? IsoDateString : T[K];
};
```

Or use a branded type approach.

**Replace manual JSON Schema types with utility:**
Remove `RequirementSchema`, `ArchitectureModelSchema`, `SoftwareComponentSchema`, `TestCaseSchema`, `TraceLinkSchema` hand-written types. Instead:

Option A: Generate schemas from interfaces (e.g., `typescript-json-schema` or `typebox`)
Option B: Create derived types: `type SerializedRequirement = Serialized<Requirement>;`

**Actually, Option B is simpler and doesn't introduce new deps.** But since AJV needs actual JSON Schema objects (not TS types) for runtime validation, we need a real JSON Schema.

**Recommendation:**
1. Replace `Date` with `IsoDateString` directly in interfaces (JSON is the wire format)
2. Add `dateFromString(value: IsoDateString): Date` / `dateToString(date: Date): IsoDateString` helpers at boundary layers
3. This eliminates the need for mirrored Schema types entirely

### Phase 2: Backend Store Alignment (`apps/backend/src/traceabilityLinks/store.ts`)

**Who:** BackendArchitect

- Delete `StoredTraceLink` interface
- Use canonical `TraceLink` directly with dates as `IsoDateString`
- Remove manual `mapToTraceLink()` conversion
- Update `update()` method to use proper types

### Phase 3: Frontend Type Cleanup (`apps/frontend/src/api/client.ts`)

**Who:** FrontendArchitect

- Replace `ArtefactRequirement` with canonical `Requirement` (date fields are strings after Phase 1)
- Replace `ArtefactArchitecture` with canonical `ArchitectureModel` (or `Pick<ArchitectureModel, ...>`)
- Replace `ArtefactComponent` with canonical `SoftwareComponent` (or `Pick<...>`)
- Replace `ArtefactTestCase` with canonical `TestCase` (or `Pick<...>`)
- Replace `ArtefactTrace` with canonical `TraceLink` (or `Pick<...>`)
- Remove `'draft'` from status enum if not needed, or add to canonical type if it is

---

## Implementation Plan

### Child Issues

| Issue | Scope | Agent | Dependencies |
|-------|-------|-------|-------------|
| THE-96.1 | Core type unification (types.ts, date handling, index.ts) | BackendArchitect | None |
| THE-96.2 | Frontend type cleanup (client.ts, sample-data.ts) | FrontendArchitect | THE-96.1 |
| THE-96.3 | Backend store type cleanup (store.ts) | BackendArchitect | THE-96.1 |
| THE-96.4 | JSON Schema derivation from types (schema.ts) | BackendArchitect | THE-96.1 |

### Ordering

```
THE-96 (this epic)
├── THE-96.1 Core types ← FIRST (no deps)
├── THE-96.4 Schema derivation ← after THE-96.1
├── THE-96.2 Frontend cleanup ← after THE-96.1
└── THE-96.3 Backend store cleanup ← after THE-96.1
```

THE-96.1 and THE-96.4 can be parallelized. THE-96.2 and THE-96.3 depend on THE-96.1 but not on each other.

### Key Design Decision: Date Handling

**Decision:** Use `IsoDateString` (branded `string`) in all interfaces. Remove `Date` from core types.

**Rationale:**
- All data enters/exits via JSON (serialized to strings)
- YAML files use ISO strings
- The backend store serializes to JSON (strings)
- Converting `Date ↔ string` at every boundary is error-prone and verbose
- Boundary converters (`dateFromString`, `dateToString`) in the backend route layer are sufficient

**Trade-off:** Internal code loses `Date` methods; callers must parse when they need date math. This is acceptable because:
- Most code passes dates through without math
- The boundary layers (API routes, loaders) do the conversion
- This eliminates the entire class of "Date vs string" type divergence

---

## Implementation Notes

### Concrete Steps for THE-96.1 (Core types)

1. In `packages/shared/src/types.ts`:
   - Change `createdAt: Date` → `createdAt: IsoDateString`
   - Change `updatedAt: Date` → `updatedAt: IsoDateString`
   - Remove `RequirementSchema`, `ArchitectureModelSchema`, `SoftwareComponentSchema`, `TestCaseSchema`, `TraceLinkSchema` hand-written types
   - Add `export type IsoDateString = string;`

2. In `packages/shared/src/index.ts`:
   - Export `IsoDateString`

3. In `packages/shared/src/requirements/schema.ts`:
   - Keep `reqDocSchema` as-is (it's a real JSON Schema object used by AJV at runtime)
   - Remove the `export type { RequirementSchema }` re-export (since the Schema types are removed)

4. In `apps/backend/src/traceabilityLinks/store.ts`:
   - Remove `StoredTraceLink` interface
   - Use `TraceLink` directly (dates are now strings)
   - Remove `mapToTraceLink()` conversion
   - Simplify `insert()` and `update()` methods
   - Change `description?: string | null` to `description?: string` in accord with canonical type
   - Fix type assertions (`as StoredTraceLink` → remove)

5. In `packages/shared/src/requirements/format.ts`:
   - No changes needed (uses `Requirement` which now has `IsoDateString` dates)

6. In `packages/shared/src/requirements/loader.ts`:
   - Fix `any` casts to use proper types where feasible

7. In `scripts/validate-requirements.mts`:
   - Verify compatibility with updated types

### Concrete Steps for THE-96.2 (Frontend cleanup)

1. In `apps/frontend/src/api/client.ts`:
   - Replace `ArtefactRequirement` with `import { Requirement } from '@nexus-engineering/shared'`
   - Remove `ArtefactArchitecture` → use `ArchitectureModel`
   - Remove `ArtefactComponent` → use `SoftwareComponent`
   - Remove `ArtefactTestCase` → use `TestCase`
   - Remove `ArtefactTrace` → use `TraceLink`
   - Remove `'draft'` from status union (it was never in canonical)
   - Update `FALLBACK_DATA` to use canonical types where cast needed

2. In `apps/frontend/src/views/ArtifactViewer/sample-data.ts`:
   - Fix any type references to match

3. Check `apps/frontend/src/` for any other type usages

### Concrete Steps for THE-96.4 (Schema derivation)

1. In `packages/shared/src/types.ts`:
   - Consider using TypeScript type predicates or branded types instead of Schema mirror types
   - OR: keep Schema types but derive them from interfaces (not hand-maintained)
   - OR: replace with `type SerializedRequirement = Serialized<Requirement>` and create real JSON Schema objects from interfaces

**Recommended:** Add a `type-fest` or `utility-types` dependency and create:
```ts
// In types.ts
type JsonSchema<T> = { /* shapes */ };
// Or just use the Serialized<> pattern and delete Schema types entirely
```

The `reqDocSchema` in `schema.ts` is a real runtime JSON Schema used for AJV validation. That one must stay. The Schema types in `types.ts` are only used as TS compile-time type checks and can be replaced by the `Serialized<>` pattern.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Backend store breaks due to type changes | Medium | Test coverage on store.ts |
| Frontend breaks due to Artefact type removal | High | FrontendArchitect must verify all component imports |
| YAML loader compatibility | Low | Loader uses `any` casts; type changes don't affect runtime behavior |
| JSON Schema validation diverges from types | Medium | Keep `reqDocSchema` as source of truth for validation; derive types from it |
