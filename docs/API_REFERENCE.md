# Nexus Engineering — API Reference

**Version:** 1.1  
**Base URL:** `http://localhost:3001/api`  
**Last Updated:** 2026-07-19

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [OAuth 2.0](#oauth-20)
4. [SAML v2](#saml-v2)
5. [Organization RBAC](#organization-rbac)
6. [Audit Log](#audit-log)
7. [Repository Scanner API](#repository-scanner-api)
8. [Artifact Registry API](#artifact-registry-api)
9. [Trace Links API](#trace-links-api)
10. [Requirements API](#requirements-api)
11. [Graph Builder API](#graph-builder-api)
12. [Data Models](#data-models)
13. [Error Handling](#error-handling)

---

## Overview

The Nexus API provides programmatic access to engineering artifact management, traceability, and visualization features.

### Base URL

```
http://localhost:3000/api
```

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`

### Response Format

All responses follow a consistent envelope:

```json
{
  "data": {},           // Response payload (for single items)
  "items": [],          // Response payload (for lists)
  "summary": {},        // Aggregate data (optional)
  "pagination": {},     // Pagination info (optional)
  "error": "string"     // Error message (on failure)
}
```

---

## Authentication

The API uses **JWT Bearer token authentication**. All protected endpoints require an `Authorization: Bearer <token>` header.

### Auth Flow

1. **Register or log in** via `/api/auth/register`, `/api/auth/login`, OAuth, or SAML
2. **Receive** access token (15 min expiry) + refresh token (7 day expiry)
3. **Include** `Authorization: Bearer <access_token>` on all API requests
4. **Refresh** tokens via `/api/auth/refresh` before expiry

### Auth Endpoints

#### POST /api/auth/register

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address (case-insensitive, unique) |
| `password` | string | Yes | Password (8+ characters) |
| `displayName` | string | No | Display name |

**Success Response (201):**

```json
{
  "user": { "id": "abc123", "email": "user@example.com", "displayName": "John Doe", "roleId": "role_viewer", "roleName": "viewer", "isActive": true, "emailVerified": false, "permissions": ["requirements:read", "artifacts:read", "trace-links:read", "graph:read"] },
  "accessToken": "eyJhbGci...",
  "refreshToken": "a1b2c3d4..."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Email and password are required` | Missing fields |
| 400 | `Password must be at least 8 characters` | Weak password |
| 400 | `Invalid email format` | Bad email |
| 409 | `Email already registered` | Duplicate email |

#### POST /api/auth/login

Authenticate with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**

```json
{
  "user": { "id": "abc123", "email": "user@example.com", "displayName": "John Doe", "roleId": "role_admin", "roleName": "admin", "isActive": true, "emailVerified": true, "permissions": ["admin:all", "users:read", ...] },
  "accessToken": "eyJhbGci...",
  "refreshToken": "a1b2c3d4..."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | `Invalid email or password` | Bad credentials |
| 403 | `Account is deactivated` | User disabled |

#### POST /api/auth/refresh

Refresh an expired access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4..."
}
```

**Success Response (200):**

```json
{
  "user": { ... },
  "accessToken": "eyJhbGci...",
  "refreshToken": "e5f6g7h8..."
}
```

#### POST /api/auth/logout

Logout and revoke the current refresh token. Requires authentication.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4..."
}
```

#### POST /api/auth/logout-all

Logout from all active sessions. Requires authentication.

**Headers:** `Authorization: Bearer <access_token>`

#### GET /api/auth/me

Get the currently authenticated user's profile. Requires authentication.

**Headers:** `Authorization: Bearer <access_token>`

#### GET /api/auth/roles

List all available roles. Requires authentication.

---

## OAuth 2.0

The API supports OAuth 2.0 login via **Google** and **GitHub** identity providers.

### Configuration

Set environment variables:

| Variable | Provider | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google | OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub | OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub | OAuth client secret |
| `OAUTH_CALLBACK_URL` | Both | Callback base URL (default: `http://localhost:3001`) |

### GET /api/auth/oauth/:provider

Initiate OAuth flow. Redirect the user to the returned URL.

**Path Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `provider` | string | `google`, `github` |

**Success Response (200):**

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...",
  "state": "random-state-string"
}
```

### GET /api/auth/oauth/:provider/callback

Handle OAuth callback from the identity provider. Exchange the authorization code for tokens.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code from provider |
| `state` | string | No | CSRF state parameter |

**Success Response (200):**

```json
{
  "user": { "id": "abc123", "email": "user@gmail.com", ... },
  "accessToken": "eyJhbGci...",
  "refreshToken": "",
  "isNewUser": true
}
```

**User Linking:** If the OAuth email matches an existing account, the OAuth identity is linked. If no account exists, a new one is created.

---

## SAML v2

The API supports SAML v2 Single Sign-On for enterprise identity providers.

### Configuration

| Variable | Description |
|----------|-------------|
| `SAML_CERT` | SAML certificate (base64) |
| `SAML_ISSUER` | SAML issuer entity ID |
| `SAML_ENTRYPOINT` | IdP SSO URL |

### GET /api/auth/saml/metadata

Get the SAML v2 metadata XML for configuring the identity provider.

**Success Response (200):**

Content-Type: `application/xml`

Returns SAML metadata XML document.

### POST /api/auth/saml/callback

Handle SAML callback (ACS endpoint). Accepts form-encoded SAML response.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SAMLResponse` | string | Yes | Base64-encoded SAML assertion |
| `RelayState` | string | No | Relay state from IdP |

**Success Response (200):**

```json
{
  "user": { "id": "abc123", "email": "user@company.com", ... },
  "accessToken": "eyJhbGci...",
  "refreshToken": "",
  "isNewUser": false
}
```

**Attribute Mapping:** SAML assertions can map `email`, `name`, and `role` attributes to user profile fields.

---

## Organization RBAC

The API supports multi-tenant organizations with scoped roles and membership management.

### Organization Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Organization name |
| `slug` | string | URL-friendly unique slug |
| `description` | string | Optional description |
| `ownerId` | string | User ID of owner |
| `settings` | object | Organization settings |
| `createdAt` | string | ISO 8601 |
| `updatedAt` | string | ISO 8601 |

### Org Roles

| Role | Permissions |
|------|-------------|
| `org:admin` | Full org control: update, delete, manage members, manage teams |
| `org:member` | Read and contribute to org resources |
| `org:viewer` | Read-only access to org resources |

### Organization Endpoints

All org endpoints require authentication (`Authorization: Bearer <token>`).

#### POST /api/orgs

Create a new organization. The creator is automatically added as `org:admin`.

**Request Body:**

```json
{
  "name": "My Team",
  "slug": "my-team",
  "description": "Our engineering team"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `slug` | string | Yes | URL slug (lowercase letters, numbers, hyphens) |

#### GET /api/orgs

List organizations for the authenticated user.

#### GET /api/orgs/:id

Get a single organization by ID.

#### PUT /api/orgs/:id

Update organization details. Requires `org:admin` role.

#### DELETE /api/orgs/:id

Delete an organization. Requires `org:admin` role.

### Member Management

#### GET /api/orgs/:id/members

List all members of an organization.

#### POST /api/orgs/:id/members

Add a member to an organization. Requires `org:admin`.

**Request Body:**

```json
{
  "userId": "user-id-here",
  "role": "org:member"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `userId` | string | Yes | User ID to add |
| `role` | string | No | `org:admin`, `org:member`, `org:viewer` (default: `org:member`) |

#### PUT /api/orgs/:id/members/:userId

Update a member's role. Requires `org:admin`.

**Request Body:**

```json
{
  "role": "org:admin"
}
```

#### DELETE /api/orgs/:id/members/:userId

Remove a member from an organization. Requires `org:admin`.

### Invite / Join / Leave

#### POST /api/orgs/:id/invite

Invite a user to an organization. Requires `org:admin`.

#### POST /api/orgs/:id/join

Join an organization (open membership).

#### POST /api/orgs/:id/leave

Leave an organization.

### Team Management (org-scoped)

#### GET /api/orgs/:orgId/teams

List teams in an organization.

#### POST /api/orgs/:orgId/teams

Create a team. Requires `org:admin`.

#### GET /api/teams/:id

Get a team by ID.

#### PUT /api/teams/:id

Update a team. Requires `org:admin`.

#### DELETE /api/teams/:id

Delete a team. Requires `org:admin`.

### Team Member Management

#### GET /api/teams/:id/members

List team members.

#### POST /api/teams/:id/members

Add a team member. Requires `org:admin`.

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `userId` | string | Yes | User ID |
| `role` | string | No | `lead`, `member` |

#### PUT /api/teams/:id/members/:userId

Update team member role. Requires `org:admin`.

#### DELETE /api/teams/:id/members/:userId

Remove team member. Requires `org:admin`.

---

## Audit Log

The API provides a structured audit trail with query, export, and retention management. All audit endpoints require `admin:all` permission.

### Audit Event Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique event ID |
| `timestamp` | string | ISO 8601 timestamp |
| `userId` | string | User who performed the action |
| `userEmail` | string | Email of the acting user |
| `action` | string | Action type (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT) |
| `resourceType` | string | Type of resource affected |
| `resourceId` | string | ID of the affected resource |
| `details` | string | Optional detailed description |
| `ipAddress` | string | Client IP address |
| `orgId` | string | Organization scope |

### GET /api/audit-logs

List audit log entries with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `orgId` | string | Filter by organization |
| `action` | string | Filter by action type |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |
| `userId` | string | Filter by user |
| `resourceType` | string | Filter by resource type |
| `search` | string | Full-text search |
| `page` | number | Page number (0-based) |
| `limit` | number | Results per page (default: 50) |

**Success Response (200):**

```json
{
  "entries": [
    {
      "id": "a1b2c3-audit",
      "timestamp": "2026-07-19T10:00:00.000Z",
      "userId": "abc123",
      "userEmail": "user@example.com",
      "action": "CREATE",
      "resourceType": "organization",
      "resourceId": "org_abc123",
      "details": null,
      "ipAddress": "127.0.0.1",
      "orgId": "org_abc123"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "page": 0,
    "hasMore": false
  }
}
```

### GET /api/audit-logs/export

Export audit logs as JSON or CSV.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | `json` or `csv` (default: `json`) |
| `orgId` | string | Filter by organization |
| `action` | string | Filter by action type |
| `startDate` | string | Start date filter |
| `endDate` | string | End date filter |

### GET /api/audit-logs/:id

Get a single audit log entry by ID.

### GET /api/audit-logs/retention/config

Get current audit log retention configuration.

### PUT /api/audit-logs/retention/config

Update audit log retention configuration. Requires `admin:all`.

**Request Body:**

```json
{
  "ttlDays": 90,
  "enabled": true
}
```

### POST /api/audit-logs/purge

Manually purge old audit log entries based on retention config. Returns count of purged entries.

---

## Repository Scanner API

Scan repositories to discover engineering artifacts.

### POST /api/scan

Trigger a repository scan and return file metadata with hierarchical tree structure.

**Request Body:**

```json
{
  "repositoryPath": ".",
  "options": {
    "ignorePatterns": ["node_modules", ".git"],
    "maxFileSize": 1048576,
    "depthLimit": 10,
    "computeHashes": false,
    "includeTree": true
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `repositoryPath` | string | Yes | — | Path to repository (absolute or relative) |
| `options.ignorePatterns` | string[] | No | `["node_modules", ".git"]` | Directories to exclude |
| `options.maxFileSize` | number | No | `1048576` | Max file size in bytes |
| `options.depthLimit` | number | No | `null` | Max directory depth |
| `options.computeHashes` | boolean | No | `false` | Compute SHA-256 content hashes |
| `options.includeTree` | boolean | No | `false` | Include hierarchical tree in response |

**Success Response (200):**

```json
{
  "scanId": "scan-abc123",
  "fileMetadata": [
    {
      "filePath": "/absolute/path/to/file.ts",
      "relativePath": "src/file.ts",
      "size": 1234,
      "contentHash": "sha256-hash",
      "contentType": "text",
      "detectedType": "requirement"
    }
  ],
  "totalFiles": 150,
  "artifacts": [
    {
      "artifactType": "requirement",
      "filePath": "/absolute/path/to/req.yaml",
      "relativePath": "docs/req.yaml",
      "fileName": "req.yaml",
      "detectedAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "totalArtifacts": 5,
  "scanReport": {
    "filesFound": 150,
    "bytesScanned": 102400,
    "scanTimeMs": 250,
    "errors": []
  },
  "tree": {
    "root": {
      "id": "root",
      "path": "/absolute/path",
      "name": "repository",
      "type": "directory",
      "children": []
    },
    "nodesByPath": {}
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Invalid repository path` | Path does not exist or is invalid |
| 500 | `Scan failed: <reason>` | Internal scan error |

---

### GET /api/scan

Scan repository with query parameters (simpler alternative).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repositoryPath` | string | Yes | Path to repository |

**Response:** Same as POST /api/scan

---

### GET /api/scan/tree

Get lightweight tree structure for initial UI mount.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repositoryPath` | string | Yes | Path to repository |

**Success Response (200):**

```json
{
  "root": {
    "id": "root",
    "path": "/absolute/path",
    "name": "repository",
    "type": "directory",
    "children": [
      {
        "id": "src",
        "path": "/absolute/path/src",
        "name": "src",
        "type": "directory",
        "children": []
      }
    ]
  },
  "nodesByPath": {
    "/absolute/path/src": {}
  }
}
```

---

### POST /api/scan/stream

Stream files matching glob patterns (lazy loading).

**Request Body:**

```json
{
  "patterns": ["**/*.req.yaml", "**/*.adr.yaml"],
  "rootPath": "/absolute/path/to/repository"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patterns` | string[] | Yes | Glob patterns to match files |
| `rootPath` | string | Yes | Root path for file search |

**Success Response (200):**

Newline-delimited JSON stream:

```json
{"filePath": "/path/to/file1.req.yaml", "relativePath": "docs/file1.req.yaml", "contentType": "text"}
{"filePath": "/path/to/file2.req.yaml", "relativePath": "docs/file2.req.yaml", "contentType": "text"}
```

---

### GET /api/scan/file

Get file content by path.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute file path |

**Success Response (200):**

```json
{
  "path": "/absolute/path/to/file.ts",
  "content": "file contents here...",
  "extension": "ts",
  "language": "typescript",
  "fileSize": 1234
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 404 | `File not found: <path>` |

---

## Artifact Registry API

Manage discovered engineering artifacts.

### GET /api/artifacts/registry

List all artifacts with aggregate summary.

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "artifact-001",
      "filePath": "/path/to/req.yaml",
      "artifactType": "requirement",
      "lifecycle": "related",
      "metadata": {},
      "createdAt": "2026-07-18T10:00:00.000Z",
      "updatedAt": "2026-07-18T10:05:00.000Z"
    }
  ],
  "summary": {
    "total": 25,
    "byType": {
      "requirement": 10,
      "architecture": 8,
      "adr": 5,
      "spec": 2
    },
    "byLifecycle": {
      "discovered": 2,
      "parsed": 5,
      "indexed": 10,
      "related": 8
    }
  }
}
```

---

### GET /api/artifacts/registry/type/:type

Filter artifacts by type.

**Path Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `type` | string | `requirement`, `architecture`, `adr`, `spec`, `unknown` |

**Success Response (200):**

```json
{
  "data": [],
  "total": 10,
  "filter": {
    "type": "requirement"
  }
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `Invalid artifact type '<type>'. Allowed: requirement, architecture, adr, spec` |

---

### GET /api/artifacts/registry/:id

Get artifact by ID with full lifecycle details.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Artifact unique identifier |

**Success Response (200):**

```json
{
  "data": {
    "id": "artifact-001",
    "filePath": "/path/to/req.yaml",
    "artifactType": "requirement",
    "lifecycle": "related",
    "metadata": {
      "title": "User Authentication",
      "priority": "high"
    },
    "createdAt": "2026-07-18T10:00:00.000Z",
    "updatedAt": "2026-07-18T10:05:00.000Z"
  }
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 404 | `Artifact not found` |

---

### PATCH /api/artifacts/registry/:id

Update artifact lifecycle state and/or metadata.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Artifact unique identifier |

**Request Body:**

```json
{
  "lifecycle": "parsed",
  "metadata": {
    "title": "Updated Title"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `lifecycle` | string | Target lifecycle state |
| `metadata` | object | Metadata to merge |

**Allowed Lifecycle Transitions:**

| Current State | Allowed Transitions |
|---------------|---------------------|
| `discovered` | `parsed`, `error` |
| `parsed` | `indexed` |
| `indexed` | `related` |
| `related` | *(none)* |
| `error` | `discovered` |

**Success Response (200):**

```json
{
  "data": {},
  "success": true
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 404 | `Artifact not found` |
| 409 | `Cannot transition from 'discovered' to 'related'. Allowed: parsed, error` |

---

### POST /api/artifacts/registry/:id/reparse

Reset artifact to discovered state and mark for re-parse.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Artifact unique identifier |

**Success Response (200):**

```json
{
  "data": {
    "lifecycle": "discovered",
    "metadata": {
      "reparseRequestedAt": "2026-07-18T10:00:00.000Z",
      "originalLifecycle": "related"
    }
  },
  "success": true
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 404 | `Artifact not found` |

---

## Trace Links API

Manage traceability relationships between artifacts.

### GET /api/trace-links

List all trace links.

**Success Response (200):**

```json
{
  "traceLinks": [
    {
      "id": "trace-001",
      "sourceId": "REQ-001",
      "sourceType": "requirement",
      "targetId": "TC-001",
      "targetType": "testCase",
      "relationshipType": "verifies",
      "confidence": "high",
      "description": "Test case verifies requirement",
      "version": "1.0",
      "createdAt": "2026-07-18T10:00:00.000Z",
      "updatedAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "total": 15
}
```

---

### GET /api/trace-links/:id

Get trace link by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trace link unique identifier |

**Success Response (200):**

```json
{
  "id": "trace-001",
  "sourceId": "REQ-001",
  "sourceType": "requirement",
  "targetId": "TC-001",
  "targetType": "testCase",
  "relationshipType": "verifies",
  "confidence": "high",
  "description": "Test case verifies requirement"
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `Trace link ID is required` |
| 404 | `Traceability link not found` |

---

### GET /api/trace-links/source/:sourceType/:sourceId

Get trace links by source artifact.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceType` | string | Source artifact type |
| `sourceId` | string | Source artifact ID |

**Success Response (200):**

```json
{
  "traceLinks": [],
  "sourceType": "requirement",
  "sourceId": "REQ-001",
  "total": 3
}
```

---

### GET /api/trace-links/target/:targetType/:targetId

Get trace links by target artifact.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targetType` | string | Target artifact type |
| `targetId` | string | Target artifact ID |

**Success Response (200):**

```json
{
  "traceLinks": [],
  "targetType": "testCase",
  "targetId": "TC-001",
  "total": 2
}
```

---

### POST /api/trace-links

Create a new trace link.

**Request Body:**

```json
{
  "sourceId": "REQ-001",
  "sourceType": "requirement",
  "targetId": "TC-001",
  "targetType": "testCase",
  "relationshipType": "verifies",
  "confidence": "high",
  "description": "Test case verifies requirement"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceId` | string | Yes | Source artifact ID |
| `sourceType` | string | Yes | Source artifact type |
| `targetId` | string | Yes | Target artifact ID |
| `targetType` | string | Yes | Target artifact type |
| `relationshipType` | string | Yes | Relationship type |
| `confidence` | string | Yes | Confidence level |
| `description` | string | No | Description |

**Success Response (201):**

```json
{
  "id": "trace-002",
  "sourceId": "REQ-001",
  "sourceType": "requirement",
  "targetId": "TC-001",
  "targetType": "testCase",
  "relationshipType": "verifies",
  "confidence": "high",
  "version": "1.0",
  "createdAt": "2026-07-18T10:00:00.000Z",
  "updatedAt": "2026-07-18T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `Source ID, source type, target ID, target type, relationship type and confidence are required` |

---

### PUT /api/trace-links/:id

Update an existing trace link.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trace link unique identifier |

**Request Body:**

```json
{
  "confidence": "medium",
  "description": "Updated description"
}
```

**Success Response (200):**

```json
{
  "id": "trace-001",
  "confidence": "medium",
  "description": "Updated description"
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 404 | `Traceability link not found` |

---

### DELETE /api/trace-links/:id

Delete a trace link.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trace link unique identifier |

**Success Response (200):**

```json
{
  "message": "Traceability link trace-001 deleted successfully"
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `Trace link ID is required` |
| 404 | `Traceability link not found` |

---

## Requirements API

Manage requirements-as-code documents.

### GET /api/requirements

List all loaded requirement documents mapped to frontend artifacts.

**Success Response (200):**

```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "version": "1.0",
      "createdAt": "2026-07-18T10:00:00.000Z",
      "updatedAt": "2026-07-18T10:00:00.000Z",
      "source": "requirements-yaml",
      "type": "functional",
      "title": "User Authentication",
      "description": "The system shall authenticate users...",
      "priority": "high",
      "status": "approved",
      "tags": ["security", "auth"],
      "traceLinks": []
    }
  ],
  "architectures": [],
  "components": [],
  "testCases": [],
  "traces": [],
  "total": 10
}
```

---

### GET /api/requirements/:id

Get single requirement by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Requirement ID |

**Success Response (200):**

```json
{
  "requirement": {
    "id": "REQ-001",
    "nexus": {
      "metadata": {
        "documentId": "PRJ-REQ-001",
        "domain": "authentication"
      }
    },
    "requirements": []
  }
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `Requirement ID is required` |
| 404 | `Requirement not found` |

---

### GET /api/requirements/domain/:domain

Filter requirements by domain.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | string | Domain name to filter by |

**Success Response (200):**

```json
{
  "requirements": [],
  "architectures": [],
  "components": [],
  "testCases": [],
  "traces": [],
  "domain": "authentication",
  "total": 5
}
```

---

### POST /api/requirements/scan

Trigger rescan of repository path.

**Request Body:**

```json
{
  "repositoryPath": "/absolute/path/to/repository"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repositoryPath` | string | Yes | Path to scan for requirement files |

**Success Response (200):**

```json
{
  "requirements": [],
  "architectures": [],
  "components": [],
  "testCases": [],
  "traces": [],
  "total": 10,
  "scanned": 5,
  "message": "Scanned 5 requirement files"
}
```

**Error Responses:**

| Status | Error |
|--------|-------|
| 400 | `repositoryPath is required` |

---

## Graph Builder API

Generate traceability graphs for visualization.

### GET /api/graph/traceability

Get full traceability graph with all artifacts and relationships.

**Success Response (200):**

```json
{
  "nodes": [
    {
      "id": "REQ-001",
      "type": "requirement",
      "label": "User Authentication",
      "properties": {
        "priority": "high",
        "status": "approved"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-001",
      "source": "REQ-001",
      "target": "TC-001",
      "type": "verifies",
      "confidence": "high"
    }
  ],
  "totalNodes": 25,
  "totalEdges": 30
}
```

---

### GET /api/graph/traceability/filtered

Get filtered traceability graph.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceTypes` | string[] | Filter by source artifact types |
| `targetTypes` | string[] | Filter by target artifact types |
| `relationships` | string[] | Filter by relationship types |

**Example Request:**

```
GET /api/graph/traceability/filtered?sourceTypes=requirement&targetTypes=testCase&relationships=verifies
```

**Success Response (200):**

```json
{
  "nodes": [],
  "edges": [],
  "totalNodes": 0,
  "totalEdges": 0,
  "filters": {
    "sourceTypes": ["requirement"],
    "targetTypes": ["testCase"],
    "relationships": ["verifies"]
  }
}
```

---

### GET /api/graph/traceability/sorted

Get confidence-sorted traceability graph.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `descending` | boolean | `true` | Sort order |

**Success Response (200):**

```json
{
  "nodes": [],
  "edges": [],
  "totalNodes": 0,
  "totalEdges": 0,
  "sort": {
    "by": "confidence",
    "descending": true
  }
}
```

---

### GET /api/trace-graph

Alternative graph endpoint (simplified response).

**Success Response (200):**

```json
{
  "nodes": [],
  "edges": [],
  "totalNodes": 0,
  "totalEdges": 0
}
```

---

## Data Models

### BaseEntity

```typescript
interface BaseEntity {
  id: string;
  version: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  source: string;
}
```

### Requirement

```typescript
interface Requirement extends BaseEntity {
  type: 'functional' | 'non-functional' | 'system' | 'user';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified';
  tags?: string[];
  traceLinks?: RequirementTraceLink[];
}
```

### ArchitectureModel

```typescript
interface ArchitectureModel extends BaseEntity {
  type: 'blockDefinition' | 'internalBlockDiagram' | 'stateMachine' | 
        'sequenceDiagram' | 'parametricDiagnostic' | 'requirementTraceabilityMatrix';
  name: string;
  description: string;
  elements: ArchitectureElement[];
  relationships?: ArchitectureRelationship[];
}
```

### SoftwareComponent

```typescript
interface SoftwareComponent extends BaseEntity {
  name: string;
  type: 'module' | 'class' | 'interface' | 'enum' | 'service' | 'component' |
        'microService' | 'library' | 'configuration';
  description: string;
  path?: string;
  language?: string;
  technologies?: string[];
  dependencies?: string[];
}
```

### TestCase

```typescript
interface TestCase extends BaseEntity {
  name: string;
  type: 'unit' | 'integration' | 'system' | 'acceptable' | 'performance' |
        'security' | 'usability';
  description: string;
  testSteps?: TestStep[];
  expectedResult: string;
  status: 'draft' | 'ready' | 'inProgress' | 'completed' | 'failed';
  automationStatus: 'manual' | 'automated' | 'partially-automated';
}
```

### TraceLink

```typescript
interface TraceLink extends BaseEntity {
  sourceId: string;
  sourceType: 'requirement' | 'architectureModel' | 'softwareComponent' |
               'testCase' | 'traceLink';
  targetId: string;
  targetType: 'requirement' | 'architectureModel' | 'softwareComponent' |
               'testCase' | 'traceLink';
  relationshipType: 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' |
                     'refines' | 'conflictsWith';
  confidence: 'high' | 'medium' | 'low';
  description?: string;
}
```

### FileMetadata

```typescript
interface FileMetadata {
  filePath: string;
  relativePath: string;
  size: number;
  contentHash: string;
  contentType: 'text' | 'binary';
  detectedType?: 'requirement' | 'architectureModel' | 'softwareComponent' |
    'testCase' | 'traceLink' | 'spec' | 'adr';
}
```

### ScanOutput

```typescript
interface ScanOutput {
  scanId: string;
  fileMetadata: FileMetadata[];
  totalFiles: number;
  artifacts: DetectedArtifact[];
  totalArtifacts: number;
  scanReport: ScanReport;
  tree?: RepositoryTree;
  pagination: PaginationMeta;
}
```

### PaginationMeta

```typescript
interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (resource does not exist) |
| 409 | Conflict (invalid state transition) |
| 500 | Internal Server Error |

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `Invalid repository path` | 400 | Path does not exist | Verify path is correct |
| `Artifact not found` | 404 | Invalid artifact ID | Check artifact exists |
| `Trace link ID is required` | 400 | Missing ID parameter | Provide valid ID |
| `Cannot transition lifecycle` | 409 | Invalid state change | Check allowed transitions |
| `Scan failed: <reason>` | 500 | Scan error | Check repository permissions |

---

## Rate Limiting

Currently, no rate limiting is enforced. Production deployments should implement rate limiting to protect system resources.

**Recommended Limits:**
- Scan endpoints: 10 requests per minute
- List endpoints: 100 requests per minute
- Mutation endpoints: 30 requests per minute

---

## CORS

The API allows cross-origin requests from development origins:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (API server)

Production deployments should configure CORS for specific domains.

---

## Changelog

### v1.1.0 (2026-07-19)

- Authentication: email/password register, login, refresh, logout, roles
- OAuth 2.0: Google and GitHub provider login
- SAML v2: ACS endpoint, metadata endpoint, attribute mapping
- Organization RBAC: org CRUD, member management, teams, invite/join/leave
- Audit Log: structured events, query API, filters, CSV export, retention config

### v1.0.0 (2026-07-18)

- Initial API release
- Repository Scanner endpoints
- Artifact Registry endpoints
- Trace Links CRUD endpoints
- Requirements endpoints
- Graph Builder endpoints
