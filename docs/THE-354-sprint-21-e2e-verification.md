## QA Befund — THE-354 Sprint 21 W3: Sprint 21 E2E Verification

**Status:** QA: PASS (with fix)
**Datum:** 2026-07-26
**Getestete Commits:** `af336c7` (HEAD)
**Geprüfte Commits:** Sprint 21 scope — `97beeaf` (v0.1.0 baseline) → HEAD

---

### Zusammenfassung

| Kategorie | Ergebnis |
|-----------|----------|
| Unit Tests (shared) | 44/44 ✅ |
| Integration (backend) | 373/373 ✅ |
| Component (frontend) | 156/156 ✅ |
| E2E (Chromium) | 40/40 ✅ |
| E2E (Firefox) | 40/40 ✅ |
| E2E (Mobile Chrome) | 40/40 ✅ |
| E2E (WebKit) | 0/40 ⚠️ (environment — missing system deps) |
| TypeScript (frontend) | ✅ Clean |
| TypeScript (backend) | ✅ Clean (pre-existing excluded files in store.test.ts) |
| TypeScript (shared) | ✅ Clean |
| Lint | ⚠️ Pre-existing failures (46 errors across monorepo) |

### Kritische User Flows — Coverage

| Flow | E2E Abdeckung | Status |
|------|--------------|--------|
| 1. QR-Scan → Check-in → Hallen-Map | `discovery.spec.ts`, `navigation.spec.ts` | ✅ |
| 2. Intent → Bubble → Join | `forms.spec.ts`, `recommendations-panel.spec.ts` | ✅ |
| 3. Event → QR → Dashboard | `discovery.spec.ts`, `trace-gate.spec.ts` | ✅ |
| 4. Live-Dashboard: SSE-Stream, Metriken | `trace-gate.spec.ts`, `responsive.spec.ts` | ✅ |

### Sprint 21 Changes (seit v0.1.0)

| Issue | Bereich | Art | Test Coverage |
|-------|---------|-----|---------------|
| THE-351 | Frontend: AuditLogViewer Split | Refactor | Covered by `AuditLogViewer/index.test.tsx` |
| THE-322/340 | Minerva BPMN Pipeline | Feature | 6 neue Testdateien (backend) |
| THE-338 | Bundle Splitting | Feature | E2E pass rate restored (THE-341 fix) |
| THE-330 | AppError Route Härtung | Refactor | Alle Route-Tests passieren |
| THE-326 | Heading Hierarchy (a11y) | Fix | E2E theme + navigation tests |
| THE-335 | Keyboard Tab Order | Fix | E2E theme keyboard test |

### Findings

#### F1: GraphCache Serialisierung — GEFIXT

**Typ:** regression (cache nie funktionsfähig)
**Datei:** `apps/backend/src/lib/graphCache.ts:18`
**Fehler:** `set()` speicherte Roh-Objekte statt `JSON.stringify(value)`. Jeder Cache-Hit warf `SyntaxError: "[object Object]" is not valid JSON`.
**Auswirkung:** Cache in `impactAnalyzer`, `recommendationEngine`, `coverageAnalyzer`, `traceabilityService` war defekt.
**Fix:** `graphCache.set()` serialisiert nun mit `JSON.stringify()`. Alle 4 Caller profitieren.

#### F2: impactAnalyzer Cache-Key — GEFIXT

**Typ:** regression
**Datei:** `apps/backend/src/ai/impactAnalyzer.ts:67`
**Fehler:** Cache-Key nutzte `scope.artifactId` (singular, immer `undefined`) statt `scope.artifactIds` (plural). Alle `analyzeV2`-Calls teilten denselben Key → **Cache Poisoning** zwischen unterschiedlichen Scopes.
**Auswirkung:** `impactReportGenerator.test.ts` schlug fehl (falsche RiskLevel-Werte durch vercachte Daten von vorherigen Tests).
**Fix:** Cache-Key basiert nun auf `scope.artifactIds.sort().join(',')`.

### Failure-Klassifikation

| Typ | Count | Details |
|-----|-------|---------|
| Neu (regression) | 0 | Alle Regressionen durch F1+F2 gefixt |
| Pre-existing | ~46 | Lint-Fehler (THE-469, monorepo-weit) |
| Pre-existing | 5 | `store.test.ts` typecheck errors |
| Environment | 40 | WebKit E2E — fehlende System-Dependencies |
| Flaky | 0 | — |

### TypeScript

- `tsc -b` (frontend): ✅ No errors
- `tsc --noEmit` (backend): ✅ No errors (excluded `store.test.ts` has pre-existing issues not related to Sprint 21)
- `tsc --noEmit` (shared): ✅ No errors

### Seed-Daten Management

Alle Testdaten werden via `getGraphDatabase()` in `beforeAll`/`beforeEach` gesetzt. Keine manuellen Seed-Skripte. Bestätigung: reproduzierbare Testumgebungen.

### Empfehlung

**Merge freigegeben** — alle Kriterien erfüllt:
1. ✅ `tsc --noEmit` / `tsc -b` grün
2. ✅ Alle Tests grün (Unit, Integration, E2E auf Chromium/Firefox)
3. ✅ WebKit-E2E-Failures sind Environment-bedingt (in CI via `playwright install --with-deps` abgedeckt)
4. ✅ Zwei Cache-Bugs in `graphCache.ts` und `impactAnalyzer.ts` identifiziert und gefixt
5. ✅ Lint-Failures sind pre-existing (THE-469)
