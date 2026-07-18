# Nexus Engineering — Developer Guide

**Version:** 1.0  
**Last Updated:** 2026-07-18

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Code Style & Linting](#code-style--linting)
8. [Building & Deployment](#building--deployment)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide covers everything you need to know to contribute to the Nexus Engineering platform. Whether you're fixing a bug, adding a feature, or improving documentation, this guide will help you get started.

### Architecture Overview

Nexus Engineering is a monorepo built with:

- **Frontend**: React 19 + Vite 6 + Tailwind CSS 3.4
- **Backend**: Fastify 5 + TypeScript
- **Shared**: TypeScript types and utilities
- **Testing**: Vitest + Testing Library + Playwright

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ (recommended: 20 LTS)
- **pnpm** 9+ (package manager)
- **Git** (version control)
- **Code Editor** (VS Code recommended)

### Optional Tools

- **Docker** (for local database development)
- **Railway CLI** (for deployment testing)

---

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nexus
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies across the monorepo.

### 3. Start Development Servers

```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server with HMR)
- **Backend**: http://localhost:3000 (Fastify API server)

### 4. Environment Variables

Create `.env` files if needed:

```bash
# apps/backend/.env
PORT=3000
NODE_ENV=development
```

---

## Project Structure

```
nexus/
├── apps/
│   ├── backend/                 # Fastify API server
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── scanners/       # Repository scanning logic
│   │   │   ├── parsers/        # Artifact parsing
│   │   │   ├── graphBuilder/   # Graph construction
│   │   │   ├── artifacts/      # Artifact registry
│   │   │   └── traceabilityLinks/ # Trace link management
│   │   └── package.json
│   └── frontend/                # React application
│       ├── src/
│       │   ├── main.tsx        # Entry point
│       │   ├── App.tsx         # Root component
│       │   ├── views/          # Page components
│       │   │   ├── DiscoveryDashboard/
│       │   │   ├── RepositoryTree/
│       │   │   ├── ArtifactViewer/
│       │   │   └── GraphBuilder/
│       │   ├── components/     # Shared UI components
│       │   └── api/            # API client functions
│       └── package.json
├── packages/
│   ├── shared/                  # Shared types and utilities
│   │   └── src/
│   │       ├── types.ts        # Core data models
│   │       ├── requirements/   # Requirements loader
│   │       ├── validation/     # Schema validation
│   │       └── design-system/  # UI components
│   └── eslint-config/          # Shared ESLint configuration
├── docs/                        # Documentation
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json                 # Root package.json
```

---

## Development Workflow

### Branch Strategy

1. **main** — Production-ready code
2. **develop** — Integration branch for features
3. **feature/** — Feature branches (e.g., `feature/add-export`)
4. **fix/** — Bug fix branches (e.g., `fix/scan-error`)
5. **docs/** — Documentation updates

### Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Make your changes** in the appropriate package
2. **Write tests** for new functionality
3. **Run linting and type checks**:
   ```bash
   pnpm lint
   pnpm typecheck
   ```
4. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add export functionality to dashboard"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

### Submitting a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Create a pull request on GitHub
3. Fill out the PR template
4. Link related issues
5. Request review from maintainers

---

## Testing

### Unit Tests (Vitest)

Run unit tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

### Writing Tests

#### Component Tests

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

#### API Tests

```typescript
import { buildServer } from '../src/index'

describe('API Endpoints', () => {
  it('GET /api/health returns 200', async () => {
    const server = await buildServer()
    const response = await server.inject({
      method: 'GET',
      url: '/api/health'
    })
    expect(response.statusCode).toBe(200)
  })
})
```

---

## Code Style & Linting

### ESLint

The project uses ESLint with a shared configuration:

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### Prettier

Code formatting is handled by Prettier:

```bash
# Check formatting
pnpm format:check

# Fix formatting
pnpm format
```

### TypeScript

Type checking is enforced across all packages:

```bash
# Run type checker
pnpm typecheck
```

### Pre-commit Hooks

Husky runs pre-commit checks automatically:

- ESLint
- Prettier
- TypeScript type checking

---

## Building & Deployment

### Production Build

```bash
pnpm build
```

This builds all packages for production.

### Local Production Testing

```bash
# Build and start production servers
pnpm build
pnpm start
```

### Deployment

The project uses GitHub Actions for CI/CD:

1. **Pull Request** — Runs lint, typecheck, and tests
2. **Preview Deploy** — Deploys to Railway preview environment
3. **Production Deploy** — Deploys to Railway production on merge to `main`

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Dependencies Not Installing

```bash
# Clean install
rm -rf node_modules
pnpm install
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf apps/*/dist
rm -rf packages/*/dist
pnpm typecheck
```

#### Tests Failing

```bash
# Clear test cache
pnpm test -- --clearCache

# Run specific test file
pnpm test -- path/to/test.test.ts
```

### Getting Help

- **Documentation**: See [docs/](./) directory
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

---

## Contributing Guidelines

1. **Follow coding standards** — See [CODING_STANDARDS.md](./CODING_STANDARDS.md)
2. **Write tests** — All new features must have tests
3. **Update documentation** — Keep docs in sync with code changes
4. **Keep PRs small** — Focused changes are easier to review
5. **Be responsive** — Address review feedback promptly

---

**Last updated:** 2026-07-18 | THE-178
