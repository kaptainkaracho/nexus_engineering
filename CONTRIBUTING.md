# Contributing to Nexus Engineering

Thank you for your interest in contributing to Nexus Engineering! This document provides guidelines and information for contributors.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 9+ (package manager)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/kaptainkaracho/nexus_engineering.git
   cd nexus_engineering
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Install E2E browser dependencies (WebKit requires system libraries):
   ```bash
   # Install system dependencies for WebKit (requires sudo)
   sudo bash scripts/setup-e2e.sh
   # OR manually:
   sudo npx playwright install-deps
   cd apps/frontend && pnpm exec playwright install --with-deps chromium firefox webkit
   ```

4. Start development servers:
   ```bash
   # Start all services in parallel
   pnpm dev

   # Or start individually
   pnpm --filter @nexus-engineering/backend dev
   pnpm --filter @nexus-engineering/frontend dev
   ```

## Project Structure

This is a pnpm monorepo with the following structure:

```
nexus_engineering/
├── apps/
│   ├── backend/          # Fastify 5 + TypeScript API
│   └── frontend/         # React 19 + Vite 6 + Tailwind 3.4
├── packages/
│   └── shared/           # Shared types and utilities
├── docs/                 # Project documentation
├── reports/              # Technical reports and reviews
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── tsconfig.json         # Base TypeScript configuration
```

### Packages

- **@nexus-engineering/backend**: Fastify 5 API server with TypeScript
- **@nexus-engineering/frontend**: React 19 SPA with Vite 6 and Tailwind CSS
- **@nexus-engineering/shared**: Shared types, interfaces, and utilities

## Development Workflow

### Branch Strategy

```
main          ──●─────────────────●────────── (production, auto-deployed)
                 \               /
develop       ────●──●──●──●──●── (integration, CI on PR)
                   \  /
feat/THE-NNN  ─────●  ●
```

| Branch | Purpose | Base | Lifecycle |
|--------|---------|------|-----------|
| `main` | Production-ready code. Auto-deployed to Railway on push. | — | Protected. PR only from `release/*` or hotfix. |
| `develop` | Integration branch for active sprint work. CI runs on PRs. | `main` | Created. Always exists. |
| `feat/THE-NNN-*` | Feature branches (one per issue). | `develop` | Delete after merge. |
| `fix/THE-NNN-*` | Bug fix branches during a sprint. | `develop` | Delete after merge. |
| `hotfix/THE-NNN-*` | Urgent production fixes. | `main` | Merged to `main` + `develop`. Delete after merge. |
| `release/sprint-N` | Sprint release candidate. | `develop` | PR into `main`. Delete after merge. |

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feat/THE-NNN-your-feature-name
```

### Development Process

1. **Create a feature branch** from `develop`
2. **Make your changes** following the code style guidelines
3. **Write tests** for new functionality
4. **Run local validation**:
   ```bash
   ./scripts/validate-local.sh
   ```
   Or for a faster pre-push check:
   ```bash
   ./scripts/validate-local.sh --fast
   ```
5. **Commit your changes** with a descriptive message
6. **Push to remote** and create a pull request targeting `develop`

### Local Validation

Run full validation before pushing:

```bash
./scripts/validate-local.sh
```

This runs lint → typecheck → tests → build. It exits non-zero on any failure
and is suitable as a pre-push hook:

```bash
# Install as pre-push hook
ln -sf ../../scripts/validate-local.sh .git/hooks/pre-push
```

### Sprint Releases

At the end of each sprint, create a release branch:

```bash
./scripts/create-sprint-release.sh <N> [version]
# Example:
./scripts/create-sprint-release.sh 25 v0.2.0
```

This creates `release/sprint-25` from `develop` and optionally tags it.

**Release workflow:**

1. `./scripts/create-sprint-release.sh 25 v0.2.0` — creates branch + tag
2. `./scripts/validate-local.sh` — final validation on release branch
3. Open a PR from `release/sprint-25` into `main`
4. Merge PR → auto-deploys to Railway production
5. `git push origin v0.2.0` — push the tag
6. Merge release back to `develop`: `git checkout develop && git merge release/sprint-25`

## Code Style

### TypeScript

- Use strict TypeScript configuration (already enabled in tsconfig.json)
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` type - use `unknown` or proper types
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### React

- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript interfaces for component props
- Keep components small and focused (single responsibility)
- Use React.memo for performance-critical components

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Follow the design system tokens
- Avoid custom CSS unless necessary
- Use responsive design (mobile-first)

### Backend (Fastify)

- Use Fastify plugins for modularity
- Validate request/response with JSON Schema
- Use proper error handling with Fastify errors
- Follow RESTful API conventions

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```bash
git commit -m "feat(backend): add user authentication endpoint"
git commit -m "fix(frontend): resolve login form validation issue"
git commit -m "docs: update contributing guidelines"
git commit -m "refactor(shared): extract common types to shared package"
```

## Pull Request Process

### Before Submitting

1. **Ensure all checks pass**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

2. **Update documentation** if your changes affect APIs or user-facing features

3. **Add tests** for new functionality

### PR Description

Use the following template for your pull request description:

```markdown
## Description

[Describe your changes in detail]

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

[Describe the tests you ran to verify your changes]

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one team member
3. **QA validation** for user-facing features
4. **UX review** for design-related changes
5. **Merge** after all approvals

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @nexus-engineering/backend test
pnpm --filter @nexus-engineering/frontend test

# Run tests in watch mode
pnpm --filter @nexus-engineering/frontend test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests across browsers
pnpm --filter @nexus-engineering/frontend test:e2e

# Run specific browser only
pnpm --filter @nexus-engineering/frontend test:e2e --project=webkit

# Open the Playwright UI for debugging
pnpm --filter @nexus-engineering/frontend test:e2e:ui
```

> **WebKit requirement**: WebKit tests require system libraries (`libevent-2.1-7t64`, `libavif16`, `libmanette-0.2-0`, `libwoff1`). Install them with `sudo bash scripts/setup-e2e.sh`. CI runs this automatically via `playwright install --with-deps`.

### Test Coverage

- Maintain minimum 80% code coverage for new code
- Write unit tests for business logic
- Write integration tests for API endpoints
- Write component tests for React components

### Test Structure

```
src/
├── __tests__/           # Test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx
│       └── Button.stories.tsx
└── ...
```

## Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Document complex algorithms and business logic
- Keep README files updated

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error responses

### Architecture Decisions

- Document significant architectural decisions in `docs/`
- Use Architecture Decision Records (ADRs) for major changes

## Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check the `docs/` directory

## Code of Conduct

Please follow our code of conduct in all interactions with the project:

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Respect different viewpoints and experiences

Thank you for contributing to Nexus Engineering!