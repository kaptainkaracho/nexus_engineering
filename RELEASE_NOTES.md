# v0.1.0 — Sprint 20 Stable Release

**Release Date:** 2026-07-25

## Overview
First stable release of Nexus Engineering — Engineering as Code Viewer and Traceability Platform.

## What's Included
- Sprint 20 Polish & GTM readiness
- UI consistency pass across 5 views
- 18 backend routes hardened with AppError pattern
- Bundle size reduced by 39% (69.4 KB gzip)
- Performance optimized: page load <2s
- Trace Gate CI/CD integration (Phase 3, Pillar 5)
- Minerva BPMN ingestion pipeline (Phase 3, Pillar 4)
- 573 unit tests passing (373 backend, 156 frontend, 44 shared)
- 6 E2E Playwright tests passing (Chromium + Firefox + Mobile Chrome)
- Accessibility: WCAG 1.3.1 heading hierarchy, keyboard tab order, screen reader support

## Known Issues
- 8 pre-existing TypeScript errors in backend (non-critical paths)
  - `src/auditLog/database.ts` — TS2554
  - `src/routes/recoveryRework.ts` — TS18046
  - `src/routes/traceability.ts` — TS2345, TS18048, TS2322, TS2339
- 14 WebKit E2E failures — pre-existing environment issue (missing system dependencies)
