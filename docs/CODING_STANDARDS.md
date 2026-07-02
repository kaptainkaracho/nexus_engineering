# Coding Standards — Nexus Engineering

This document defines the technical coding conventions for all Nexus Engineering packages. All contributors must follow these standards; automated linting enforces the baseline, but these guidelines cover intent and judgment calls.

---

## TypeScript (All Packages)

### Configuration

- **Strict mode** is enabled globally (`tsconfig.json` base).
- Target: `ES2022`, Module: `ESNext`, Module resolution: `bundler`.
- Never use `any` — use `unknown` and narrow with type guards.
- Prefer `interface` for object shapes; use `type` for unions, intersections, and computed types.
- Use explicit return types on exported functions and public APIs.
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of manual null checks.

### Naming

| Element | Convention | Example |
|---|---|---|
| Variables / functions | `camelCase` | `getUserById` |
| Interfaces / types / classes | `PascalCase` | `UserProfile`, `ApiResponse` |
| Constants (module-level) | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Enum members | `PascalCase` | `Status.Active` |
| Boolean variables | `is` / `has` / `should` prefix | `isLoading`, `hasPermission` |

### Exports

- Prefer **named exports** over default exports — they provide better refactoring support and explicit imports.
- Re-export public API surface from `index.ts` barrel files.

### Error Handling

- Use custom error classes extending `Error` for domain-specific errors.
- Never swallow errors silently — log or re-throw.
- Use `Result<T, E>` pattern or thrown errors consistently within a package; don't mix styles.

---

## Backend (Fastify 5)

### Structure

```
apps/backend/src/
├── index.ts              # Entry point — server bootstrap
├── plugins/              # Fastify plugins (modular, encapsulated)
│   ├── cors.ts
│   └── auth.ts
├── routes/               # Route handlers (one file per resource)
│   ├── health.ts
│   └── items.ts
├── schemas/              # JSON Schema request/response validation
│   └── items.ts
├── services/             # Business logic (framework-agnostic)
│   └── item.service.ts
└── types/                # Backend-specific types
    └── index.ts
```

### Conventions

- **Plugins for modularity:** Encapsulate cross-cutting concerns (auth, CORS, logging) as Fastify plugins.
- **JSON Schema validation:** Define `schema` objects on every route for request body, query params, and params. Fastify auto-validates at runtime.
- **Service layer:** Business logic lives in `services/`, not in route handlers. Route handlers parse input, call services, and format output.
- **Error responses:** Use `FastifyError` with appropriate HTTP status codes. Return `{ error: string, message: string }` shape.
- **Status codes:** `200` success, `201` created, `204` deleted, `400` bad request, `404` not found, `500` internal.

### RESTful API Conventions

- Use plural nouns for resources: `/items`, `/users`.
- Use HTTP methods semantically: `GET` read, `POST` create, `PUT`/`PATCH` update, `DELETE` remove.
- Version APIs via URL prefix: `/api/v1/items`.
- Use query parameters for filtering, sorting, pagination.

---

## Frontend (React 19 + Vite 6 + Tailwind 3.4)

### Component Structure

```
apps/frontend/src/
├── main.tsx              # Entry point
├── App.tsx               # Root component / router
├── components/           # Shared UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   └── Card/
│       ├── Card.tsx
│       └── index.ts
├── pages/                # Route-level components
│   ├── Home.tsx
│   └── Dashboard.tsx
├── hooks/                # Custom React hooks
├── services/             # API client functions
├── stores/               # State management (if used)
└── types/                # Frontend-specific types
```

### Conventions

- **Functional components only** — no class components.
- **Named exports** — avoid `export default` on components.
- **Props interfaces:** Define a `Props` interface (or type) for each component; export it alongside the component.
- **Keep components small:** If a component exceeds ~150 lines, split it.
- **One component per file** — filename matches component name.
- **Hooks for state and side effects:** Use `useState`, `useEffect`, `useCallback`, `useMemo` appropriately. Avoid premature memoization.

### Styling

- **Tailwind CSS utility classes** as the primary styling method.
- **No inline styles** except for truly dynamic values.
- **Design tokens** from `tailwind.config.ts` — don't hardcode colors, spacing, or typography values.
- **Responsive design:** Mobile-first approach using Tailwind breakpoints.
- **Dark mode:** Use Tailwind `class` strategy; all new components must support dark mode via `dark:` variants.

### State Management

- Local state with `useState`/`useReducer` for component-scoped data.
- Avoid prop drilling deeper than 2 levels — use context or composition.
- Server state (API data) should be fetched in route-level components or custom hooks, not in leaf components.

---

## Shared Package (`@nexus-engineering/shared`)

- Contains **only** types, interfaces, constants, and pure utility functions.
- **No side effects** — no imports of `fs`, `http`, `document`, etc.
- **No framework dependencies** — no React, Fastify, or Node.js imports.
- All exports must be usable from both backend and frontend without platform-specific code.

---

## File Organization Rules

- **Barrel exports:** Each directory with public API surface has an `index.ts` that re-exports.
- **Co-location:** Test files live next to source files (`Component.test.tsx` next to `Component.tsx`).
- **No deep imports:** Import from package barrel (`@nexus-engineering/shared`) not from internal paths.

---

## Linting & Formatting

- **ESLint** enforces code quality rules (see `packages/eslint-config`).
- **TypeScript** compiler catches type errors (`pnpm typecheck`).
- Run `pnpm lint` and `pnpm typecheck` before every commit.
- Fix lint warnings, don't suppress them with `// eslint-disable` unless justified and documented.

---

## Review Checklist

When reviewing code, verify:

- [ ] Types are explicit on exported functions
- [ ] No `any` types without justification
- [ ] Error handling covers failure cases
- [ ] Components follow single-responsibility principle
- [ ] API endpoints have JSON Schema validation
- [ ] Tailwind classes use design tokens, not hardcoded values
- [ ] New code has corresponding tests
- [ ] No secrets, keys, or credentials in source code

---

**Last updated:** 2026-07-02 | THE-64
