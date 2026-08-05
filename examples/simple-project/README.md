# Simple Project Example

A minimal example showing full traceability with just 3 documents.

## What's Included

| Document | File | Purpose |
|----------|------|---------|
| Requirement | `requirements/user-auth.req.yaml` | Defines user login requirement |
| ADR | `architecture/adr-001-auth.arch.yaml` | JWT session management decision |
| Spec | `specs/auth-login.spec.yaml` | Login implementation specification |

## Traceability Chain

```
REQ-AUTH-001 (Requirement)
    ├── satisfies ──► ADR-001 (Architecture Decision)
    └── verified-by ──► SPEC-AUTH-001 (Specification)
                            └── implements ──► TC-AUTH-LOGIN-001 (Test Case)
```

## How to Use

1. Start Nexus: `pnpm dev`
2. Go to **Scanner** view
3. Enter path: `examples/simple-project`
4. Click **Scan**
5. View trace links in **Graph View**

## Expected Results

- 3 documents ingested
- 3 trace links discovered
- Full requirement → architecture → spec → test chain visible
