# TAC Sample Documents (Epic C — THE-220)

Demo / sample documents that exercise the TAC backend (THE-218 shared package
+ THE-219 backend API) end-to-end. These are **demo-only** and do not modify
the parser, backend, or shared package.

## Layout

```
examples/tac-samples/
├── requirements/                 # .req.yaml — 3 domains, 3 requirements each
│   ├── auth.req.yaml
│   ├── audit-log.req.yaml
│   └── artifact-registry.req.yaml
├── architecture/                 # .arch.yaml — 3 ADRs
│   ├── adr-001-auth-strategy.arch.yaml
│   ├── adr-002-audit-log-storage.arch.yaml
│   └── adr-003-artifact-storage.arch.yaml
└── specs/                        # .spec.yaml — 2 per domain (6 total)
    ├── auth-login.spec.yaml
    ├── auth-session.spec.yaml
    ├── audit-capture.spec.yaml
    ├── audit-query.spec.yaml
    ├── artifact-upload.spec.yaml
    └── artifact-download.spec.yaml
```

## Coverage

| Type        | Count | Notes                                              |
|-------------|-------|----------------------------------------------------|
| Requirement | 3     | auth, audit-log, artifact-registry (3 reqs each)   |
| ADR         | 3     | all `status: accepted`                             |
| Spec        | 6     | 2 per domain; cross-link to req + arch via traces  |

The spec files reference requirements (`type: req`) and architecture decisions
(`type: arch`), so the backend derives 32 trace links across the corpus.

## Verification

Parse every sample with the real TAC backend parser (no backend changes):

```bash
# from repo root
cd apps/backend
npx tsx bin/scan.ts ../../examples/tac-samples
# or mount the folder via the TAC scan API (THE-219) and confirm
# 12 documents ingested with 0 parse errors.
```

Expected: **12 documents, 0 errors** (3 requirements, 3 ADRs, 6 specs).
