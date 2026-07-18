# Nexus Engineering — API Reference

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Last Updated:** 2026-07-18

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Repository Scanner API](#repository-scanner-api)
4. [Artifact Registry API](#artifact-registry-api)
5. [Trace Links API](#trace-links-api)
6. [Requirements API](#requirements-api)
7. [Graph Builder API](#graph-builder-api)
8. [Data Models](#data-models)
9. [Error Handling](#error-handling)

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

Currently, the API is unauthenticated for local development. Production deployments should implement authentication middleware.

**Future:** OAuth2 or API key authentication will be required for all endpoints.

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

### v1.0.0 (2026-07-18)

- Initial API release
- Repository Scanner endpoints
- Artifact Registry endpoints
- Trace Links CRUD endpoints
- Requirements endpoints
- Graph Builder endpoints
