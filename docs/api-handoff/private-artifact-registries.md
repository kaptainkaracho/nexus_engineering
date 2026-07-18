# API Handoff: Private Artifact Registries

## Business Context

Organizations need to manage private package registries (npm, PyPI, Maven) and collect their packages as engineering artifacts. This feature lets org admins configure external registry endpoints with auth credentials, scan them to discover packages, and organize those artifacts into org-scoped registries. Every artifact tracks its registry origin. Credentials are stored encrypted and never exposed past the API.

## Endpoints

### GET /api/organizations/:orgId/registries
- **Purpose**: List all registries for an organization
- **Auth**: `authenticate` (any org member)
- **Response** (200):
  ```json
  {
    "registries": [{ "id": "reg_abc123", "name": "npm Registry", "registryType": "npm", "url": "https://npm.mycompany.com", "enabled": true, "visibility": "private", "description": "Private npm packages", "organizationId": "org_xyz", "allowedRoles": null, "createdBy": "user_abc", "createdAt": "2026-07-19T00:00:00.000Z", "updatedAt": "2026-07-19T00:00:00.000Z" }],
    "total": 1
  }
  ```

### POST /api/organizations/:orgId/registries
- **Purpose**: Create a new registry
- **Auth**: `authenticate` + `admin:all` permission
- **Request**:
  ```json
  {
    "name": "npm Registry",
    "description": "Private npm packages",
    "registryType": "npm",
    "url": "https://npm.mycompany.com",
    "visibility": "private",
    "allowedRoles": null,
    "enabled": true
  }
  ```
- **Response** (201): The created registry object
- **Response** (400): `{ "error": "Registry name is required" }` or `{ "error": "Registry type must be one of: npm, pypi, maven, generic" }`
- **Response** (404): `{ "error": "Organization not found" }`
- **Notes**: `registryType` defaults to `"generic"`. `visibility` defaults to `"private"`. `enabled` defaults to `true`.

### GET /api/registries/:id
- **Purpose**: Get a single registry by ID
- **Auth**: `authenticate`
- **Response** (200): Registry object
- **Response** (404): `{ "error": "Registry not found" }`

### PUT /api/registries/:id
- **Purpose**: Update registry fields
- **Auth**: `authenticate` + `admin:all`
- **Request** (partial):
  ```json
  {
    "name": "Updated Name",
    "registryType": "maven",
    "url": "https://maven.mycompany.com",
    "enabled": false,
    "visibility": "team"
  }
  ```
- **Response** (200): Updated registry object
- **Response** (404): `{ "error": "Registry not found" }`

### DELETE /api/registries/:id
- **Purpose**: Delete a registry and all its artifact associations (cascade)
- **Auth**: `authenticate` + `admin:all`
- **Response** (200): `{ "message": "Registry {id} deleted successfully" }`
- **Response** (404): `{ "error": "Registry not found" }`

### GET /api/registries/:id/artifacts
- **Purpose**: List artifacts assigned to this registry
- **Auth**: `authenticate`
- **Response** (200):
  ```json
  {
    "data": [{ /* Artifact objects */ }],
    "links": [{ "id": "ra_abc", "registryId": "reg_abc", "artifactId": "art_123", "addedBy": "user_abc", "addedAt": "..." }],
    "total": 5
  }
  ```

### POST /api/registries/:id/artifacts
- **Purpose**: Assign an existing artifact to a registry
- **Auth**: `authenticate` + `admin:all`
- **Request**:
  ```json
  {
    "artifactId": "art_123",
    "metadata": { "key": "value" }
  }
  ```
- **Response** (201): RegistryArtifact link object
- **Response** (409): `{ "error": "Artifact is already in this registry" }`
- **Response** (404): `{ "error": "Registry not found" }` or `{ "error": "Artifact not found" }`

### DELETE /api/registries/:id/artifacts/:artifactId
- **Purpose**: Remove an artifact from a registry
- **Auth**: `authenticate` + `admin:all`
- **Response** (200): `{ "message": "Artifact removed from registry successfully" }`

### GET /api/registries/:id/credentials
- **Purpose**: Get registry credentials (secret is masked)
- **Auth**: `authenticate`
- **Response** (200):
  ```json
  {
    "id": "cred_abc",
    "registryId": "reg_abc",
    "authType": "token",
    "username": null,
    "envVar": null,
    "hasSecret": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
- **Response** (404): If no credentials configured
- **Notes**: The `secretValue` field is NEVER returned. Only `hasSecret: boolean` indicates presence.

### PUT /api/registries/:id/credentials
- **Purpose**: Create or update registry credentials (upsert by registry_id)
- **Auth**: `authenticate` + `admin:all`
- **Request**:
  ```json
  {
    "authType": "token",
    "secretValue": "npm-token-abc"
  }
  ```
  Or for basic auth:
  ```json
  {
    "authType": "basic",
    "username": "deploy",
    "secretValue": "password123"
  }
  ```
  Or for env-var based:
  ```json
  {
    "authType": "env",
    "envVar": "NPM_REGISTRY_TOKEN"
  }
  ```
- **Response** (200): Credentials object with `hasSecret: true`, never the actual secret
- **Notes**: `authType` must be one of: `none`, `basic`, `token`, `env`. When `authType` is `env`, the scanner reads the secret from `process.env[envVar]` at scan time.

### DELETE /api/registries/:id/credentials
- **Purpose**: Remove registry credentials
- **Auth**: `authenticate` + `admin:all`
- **Response** (200): `{ "message": "Registry credentials deleted successfully" }`
- **Response** (404): `{ "error": "No credentials found for this registry" }`

### POST /api/registries/:id/scan
- **Purpose**: Trigger a scan of the external registry to discover packages as artifacts
- **Auth**: `authenticate` + `admin:all`
- **Response** (202):
  ```json
  {
    "scanId": "uuid",
    "registryId": "reg_abc",
    "registryType": "npm",
    "packagesFound": 150,
    "artifactsCreated": 150,
    "errors": [],
    "scanTimeMs": 1234
  }
  ```
- **Response** (400): `{ "error": "Registry is disabled. Enable it before scanning." }` or `{ "error": "Registry has no URL configured." }`
- **Notes**: This makes HTTP requests to the configured registry URL. Auth header is built automatically from stored credentials (env var resolved at scan time). 5-second timeout per fetch.

## Data Models / DTOs

```typescript
interface ArtifactRegistry {
  id: string;           // "reg_" + nanoid
  name: string;
  description: string | null;
  organizationId: string;
  visibility: 'private' | 'team' | 'organization';
  allowedRoles: string[] | null;
  registryType: 'npm' | 'pypi' | 'maven' | 'generic';
  url: string | null;
  enabled: boolean;
  createdBy: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

interface RegistryCredentials {
  id: string;
  registryId: string;
  authType: 'none' | 'basic' | 'token' | 'env';
  username: string | null;
  // secretValue: never exposed to frontend
  envVar: string | null;
  hasSecret: boolean;   // API response only, not a stored field
  createdAt: string;
  updatedAt: string;
}

interface RegistryArtifact {
  id: string;           // "ra_" + nanoid
  registryId: string;
  artifactId: string;
  addedBy: string;
  addedAt: string;
  metadata?: Record<string, unknown>;
}

// Artifact (extended for registry origin):
interface Artifact {
  // ... existing fields ...
  registryType?: string;  // "npm" | "pypi" | "maven" | "generic"
  registryId?: string;    // which registry this was scanned from
  // Additionally in metadata:
  metadata: {
    source?: 'registry-scan';
    registryId?: string;
    registryType?: string;
    packageName?: string;
    // ... other metadata ...
  }
}
```

## Enums & Constants

| Value | Meaning | Display Label |
|-------|---------|---------------|
| `npm` | npm registry | npm |
| `pypi` | PyPI registry | PyPI |
| `maven` | Maven registry | Maven |
| `generic` | Generic registry | Generic |
| `private` | Only creator/org admins | Private |
| `team` | Specific teams via allowedRoles | Team |
| `organization` | All org members | Organization |
| `none` | No auth | No Auth |
| `basic` | Username + password | Basic Auth |
| `token` | Bearer token | Token Auth |
| `env` | Read from environment variable | Environment Variable |

## Validation Rules

- **Registry name**: Required, 1-128 chars, trimmed
- **registryType**: Must be one of `npm`, `pypi`, `maven`, `generic`
- **visibility**: Must be one of `private`, `team`, `organization`
- **authType**: Must be one of `none`, `basic`, `token`, `env`
- **URL**: Optional for creation, required for scanning. No format validation (any string accepted).
- **enabled**: Boolean. Must be `true` to scan.

## Business Logic & Edge Cases

- Registries are org-scoped: listing, creating, and managing always requires an `organizationId`.
- Deleting an organization cascades to all its registries, registry artifacts, and credentials.
- Deleting a registry cascades to its artifact associations and credentials.
- The scanner builds auth headers from stored credentials automatically:
  - `basic` → `Authorization: Basic base64(username:secretValue)`
  - `token` → `Authorization: Bearer {secretValue}`
  - `env` → `Authorization: Bearer {process.env[envVar]}`
- Artifacts created by registry scans have `registryType` and `registryId` at both the top-level and in `metadata`.
- Credential `secretValue` is NEVER returned in any API response. The `hasSecret` boolean indicates if one is set.
- Registry scan is synchronous (returns 202 with result). For large registries, consider adding async queue support in future.
- Scanner fetch has a 5-second timeout. Failed fetches are caught gracefully and reported in `errors`.

## Integration Notes

- **Recommended flow**: List orgs → select org → list/create registries → configure credentials → scan registry → view artifacts
- **Registry management dashboard**: Show all registries for the org with type icons, status badges (enabled/disabled), and quick actions (scan, edit, delete)
- **Artifact filtering**: After scanning, artifacts have `registryId` in metadata — use `/api/artifacts/by-registry` or filter client-side
- **Credential UX**: Never show the secret value; only show `hasSecret` + `authType`. Provide a clear "reset" flow to replace credentials.
- **Caching**: No server-side caching. Registry list should be fetched on page load.
- **Registry type icons**: npm (package icon), PyPI (python icon), Maven (m icon), Generic (box icon)

## Test Scenarios

1. **Happy path (create + scan)**: Create an npm registry with URL → configure token credentials → trigger scan → see artifacts with registry origin
2. **Validation errors**: Submit registry with empty name → 400. Submit with invalid type → 400.
3. **Not found**: GET/PUT/DELETE non-existent registry → 404
4. **Permission denied**: Non-admin tries to create/update/delete registry → 403
5. **Duplicate artifact**: POST same artifact to same registry twice → 409
6. **Disabled registry**: POST scan on disabled registry → 400
7. **Credential security**: PUT credentials → verify response has `hasSecret: true` but no `secretValue`
