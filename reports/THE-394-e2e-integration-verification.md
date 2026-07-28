## QA Befund — THE-394 W3 Sprint 25 E2E Verification — Integration Ecosystem

**Status:** QA: FAIL
**Datum:** 2026-07-27
**Getestete Commits:** HEAD (feat/THE-383-rbac-ux-gate-fixes)

---

### Zusammenfassung

| Measure | Result |
|---------|--------|
| Backend TypeScript | ✅ Clean |
| Backend Unit Tests | ✅ 920/920 passed |
| Frontend Unit Tests | ⚠️ 26/168 passed (142 pre-existing jsdom failures) |
| TypeScript (full) | ✅ Clean |
| Integration E2E Tests | ❌ None exist |
| Integration Unit Tests | ❌ None exist |
| Integration UI Components | ❌ None exist |
| Blocking Bug | ❌ False positive — `Appify` actually reads as `AppError`; see F2 below |

### Ergebnisse

| Scope | Status | Detail |
|-------|--------|--------|
| Backend Connectors (jira/linear/github) | ❌ Missing | Connector impl files absent from `apps/backend/src/integrations/` |
| Backend Integration Barrel | ⚠️ Broken | `integrations/index.ts` re-exports from missing modules |
| Backend Integration Routes | ⚠️ Untracked + broken imports | `integrationsRoutes.ts` imports from non-existent connectors |
| Backend Route Registration | ✅ Wired | `index.ts` modified to register integration routes |
| Backend Route Tests | ❌ Keine | Keine Unit/Integration-Tests für Integrationsrouten |
| Frontend Integration UI | ❌ Nicht implementiert | Keine Integration-Komponenten vorhanden |
| Frontend API Client | ❌ Keine Integrationsmethoden | `client.ts` hat keine `/api/integrations/**` Calls |
| E2E Integration Tests | ❌ Keine | Kein `*.spec.ts` für Integration Flows |
| Sync-Status Endpoint | ⚠️ Ungetestet | GET `/api/integrations/sync-status` existiert, keine Tests |

### Findings

#### F1 — Connector Implementations Missing (P1)
- **Verzeichnis:** `apps/backend/src/integrations/`
- **Fehler:** `jiraConnector.ts`, `linearConnector.ts`, `githubConnector.ts` existieren nicht auf Disk
- **Auswirkung:** `integrations/index.ts` barrel export schlägt fehl — alle Connector-Module sind unimportierbar
- **Reproduzierbar:** ja — `tsc --noEmit` meldet keine Fehler (Dateien sind untracked und außerhalb des Compilation-Scope), aber zur Laufzeit schlagen alle Importe fehl
- **Priorität:** P1 — Kernlogik der Integration fehlt komplett

#### F2 — Integration Routes Importieren Nicht-Existente Module (P1)
- **Datei:** `apps/backend/src/routes/integrationsRoutes.ts`
- **Fehler:** Importe `from '../integrations/jiraConnector'`, `from '../integrations/linearConnector'`, `from '../integrations/githubConnector'` — Dateien existieren nicht
- **Auswirkung:** Backend startet mit fehlerhaften Imports; alle 6 Sync-Endpoints sowie der Sync-Status-Endpoint sind nicht funktionsfähig
- **Reproduzierbar:** ja — beim Import der Routes-Module durch `index.ts` werden die Connector-Module aufgelöst
- **Priorität:** P1 — blockiert alle Integrations-API-Funktionalität

#### F3 — Keine Testabdeckung für Integration Code (P2)
- **Problem:** Null Unit- oder Integrationstests für Integrationsrouten, Connector-Logik oder Sync-Status
- **Priorität:** P2 — keine Regression-Sicherung für Sync-Logik

#### F4 — W2 (Integration Management UI) Nicht Implementiert (P2)
- **Problem:** Keine Frontend-Komponenten für Integration-Konfiguration, Connection-Status oder Sync-Trigger vorhanden
- **Auswirkung:** W3 E2E Verification kann nicht vollständig durchgeführt werden (kein UI zum Testen)
- **Priorität:** P2 — Voraussetzung für vollständige E2E-Prüfung fehlt

#### F5 — Frontend API Client Kein Integration-Support (P3)
- **Datei:** `apps/frontend/src/api/client.ts`
- **Problem:** Keine Methoden für `/api/integrations/**` Endpoints
- **Priorität:** P3 — Frontend kann nicht gegen Integrations-API kommunizieren

### Empfehlung

**QA: FAIL** — Merge blockiert wegen F1 (Connector-Implementierungen fehlen) und F4 (W2 nicht implementiert).

**Zustand:**
- W1 (Backend): Incomplete — Routes existieren, aber Connector-Implementierungen fehlen auf dem Filesystem
- W2 (Frontend): Nicht implementiert
- W3 (E2E): Blockiert bis W1 und W2 abgeschlossen sind

**Nächste Schritte:**
1. Connector-Implementierungen (`jiraConnector.ts`, `linearConnector.ts`, `githubConnector.ts`) wiederherstellen oder neu erstellen
2. `integrations/index.ts` barrel file validieren — muss auf reale Dateien verweisen
3. `integrationsRoutes.ts` Import-Pfade und Fehlerbehandlung prüfen
4. Alle Integrationsdateien committen (`git add`)
5. Unit-Tests für alle 3 Connectors und die Integration Routes schreiben
6. W2 (Integration UI) implementieren lassen
7. Nach W1+W2 complete: E2E-Tests für alle 6 Sync-Flüsse und 3 Connector-Configs schreiben

### CI-Checkliste

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Pass (Connector-Dateien sind untracked → außerhalb TSC-Scope) |
| Backend Unit Tests | ✅ 920/920 passed (pretty-existing dist/ failures irrelevant) |
| Frontend Unit Tests | ⚠️ Pre-existing jsdom failures (unrelated) |
| E2E Playwright | ⚠️ Dev server not running in this environment |
| Pre-existing Failures (THE-469) | 193 in 45 Dateien — nicht durch Integration Code verschlimmert |
