# Nexus Engineering — Team & Organisation

Stand: 2026-07-02 | Erstellt durch CEO (THE-37)

## Organisationsstruktur

```
CEO (56744193)
 └── CTO (f3b65fd2) — Technische Leitung, Architektur, Infrastruktur
      ├── BackendArchitect (5b062a5a) — Backend-Entwicklung, Datenmodell, API
      ├── FrontendArchitect (a8128946) — Frontend-Entwicklung, UI-Komponenten
      ├── UXDesigner (8962c8a9) — Design System, UX/UI, Visualisierungskonzepte
      └── QAEngineer (ca0371b3) — Teststrategie, Qualitätssicherung, Release-Gates
```

## Rollen & Verantwortlichkeiten

### CEO (56744193)
- Strategische Ausrichtung, Ressourcenallokation
- Board-Kommunikation, Goal-Setting
- Issue-Triage, Blockerbeseitigung
- Budget-Überwachung (Max. 2 Live-Execution-Issues, Single-Progress-Lock)

### CTO (f3b65fd2)
- Technische Architektur und Framework-Entscheidungen
- Code-Qualität und Review-Standards
- CI/CD, Deployment, Infrastruktur
- Technische Dokumentation
- Cross-Cutting Concerns (Auth, Monitoring, Logging)

### BackendArchitect (5b62a5a)
- Backend-Services (Fastify 5, TypeScript)
- Datenmodell & Schema-Design
- REST API, Graph Builder, Parser (Ziel 3)
- Relationship Engine (Ziel 5)
- Repository Reader & Suchindex

### FrontendArchitect (a8128946)
- React 19 + Vite 6 Frontend-Entwicklung
- Dashboard, Explorer, Detailseiten (Ziel 4)
- Graph View, Trace Matrix (Ziel 5)
- State Management, API-Integration
- Tailwind 3.4 UI-Implementierung

### UXDesigner (8962c8a9)
- Design System & Komponentenbibliothek
- Graph-Visualisierungskonzepte (Ziel 4, 5)
- Wireframes & Prototypen
- Accessibility (WCAG 2.2)
- User Research & Usability Testing

### QAEngineer (ca0371b3)
- Teststrategie & Testabdeckung
- E2E-Tests (Backend + Frontend)
- Performance- & Lasttests (Ziel 7)
- Release-Gate-Kriterien
- Bug-Triage & Regression-Tests

## Rollen-Gap-Analyse

| Rolle | Status | Begründung |
|---|---|---|
| CMO (Marketing/Content) | **Nicht besetzt** — P2 | Kein P0-Bedarf im MVP. Dokumentation wird von CTO und Entwicklern mitgetragen. |
| DevOps/SRE | **Nicht besetzt** — P2 | CTO deckt CI/CD und Deployment initial ab. Bei Produktionsreife evaluieren. |
| AI/ML-Spezialist | **Nicht besetzt** — P2 | Wird erst für Ziel 6 (AI Assistant) benötigt. Zum gegebenen Zeitpunkt einstellen. |

**Fazit:** Das aktuelle Team (CTO + 2 Engineers + Designer + QA) ist für die MVP-Entwicklung (Ziele 1–4) ausreichend aufgestellt. Keine Soforteinstellungen erforderlich.

## WIP-Limits & Governance

- **Execution Layer Limit:** Max. 2 Live-Issues (Engineers, UXDesigner)
- **Single-Progress Lock:** Nur 1 Execution-Agent gleichzeitig in `in_progress`
- **Agent WIP-Limit:** 1 aktives Issue pro Execution-Agent
- **CEO/CTO:** Von Execution-Limits ausgenommen (Management-Layer)

## Kommunikationswege

- **Technische Tasks:** → CTO (Routing)
- **Design/UX-Tasks:** → UXDesigner
- **Cross-Functional:** → CTO mit UXDesigner-Submandat
- **Blocker:** → CEO (Eskalation)
