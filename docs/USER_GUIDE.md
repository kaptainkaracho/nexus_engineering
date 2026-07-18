# Nexus Engineering — User Guide

**Version:** 1.0  
**Last Updated:** 2026-07-18

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Discovery Dashboard](#discovery-dashboard)
4. [Repository Tree](#repository-tree)
5. [Artifact Viewer](#artifact-viewer)
6. [Graph Builder](#graph-builder)
7. [Requirements-as-Code](#requirements-as-code)
8. [Traceability Links](#traceability-links)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

**Nexus Engineering** is a modern web platform for **Engineering as Code traceability**. It automatically discovers, analyzes, and visualizes engineering artifacts (requirements, architecture models, software components, test cases) managed as code in Git repositories.

### Core Value Proposition

- **End-to-end traceability**: Link requirements through architecture to implementation and testing
- **Automated discovery**: Automatically detect and classify engineering artifacts
- **Visual dashboard**: Intuitive interface for exploring your engineering data
- **Code-first approach**: All artifacts are managed as code in your repository

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Artifact** | Any engineering document: requirement, architecture model, ADR, spec |
| **Trace Link** | A relationship between two artifacts (e.g., requirement → test case) |
| **Scan** | The process of analyzing a repository to discover artifacts |
| **Lifecycle** | The state progression of an artifact: discovered → parsed → indexed → related |

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Git repository with engineering artifacts (`.req.yaml`, `.adr.yaml`, `.spec.yaml` files)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nexus

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Fastify API)

### First Scan

1. Open the application at http://localhost:5173
2. Navigate to **Discovery Dashboard**
3. Click **New Scan**
4. Enter your repository path (e.g., `.` for current directory)
5. Wait for the scan to complete

The dashboard will display all detected artifacts organized by type.

---

## Discovery Dashboard

The Discovery Dashboard is your main entry point for exploring engineering artifacts.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Nexus Engineering                              [Scan]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Artifact    │           Artifact Details              │
│  Summary     │                                          │
│              │                                          │
│  ┌────────┐  │  ┌────────────────────────────────────┐  │
│  │ Req: 5 │  │  │ Title: User Authentication         │  │
│  │ Arch: 3│  │  │ Status: Approved                   │  │
│  │ ADR: 2 │  │  │ Priority: High                     │  │
│  │ Spec: 1│  │  │                                    │  │
│  └────────┘  │  │ Description:                       │  │
│              │  │ The system shall authenticate...    │  │
│  Artifact    │  └────────────────────────────────────┘  │
│  List        │                                          │
│  ──────────  │  Trace Links                            │
│  ▸ REQ-001   │  ┌────────────────────────────────────┐  │
│  ▸ REQ-002   │  │ → verifies TC-001                  │  │
│  ▸ ARCH-001  │  │ → dependsOn REQ-000                │  │
│  ▸ ADR-001   │  └────────────────────────────────────┘  │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Features

#### Artifact Summary

Displays aggregate counts by artifact type:
- **Requirements**: Functional, non-functional, system, user requirements
- **Architecture Models**: Block definitions, diagrams, state machines
- **ADRs**: Architecture Decision Records
- **Specifications**: Detailed specification documents

#### Artifact List

Browse all discovered artifacts with:
- **Filter by type**: Click artifact type tabs to filter
- **Search**: Type in the search box to filter by title or description
- **Sort**: Click column headers to sort by name, status, or date

#### Artifact Details

Click any artifact to view:
- **Metadata**: ID, version, status, priority
- **Description**: Full description text
- **Trace Links**: All relationships to other artifacts
- **Lifecycle**: Current state in the processing pipeline

### Actions

| Action | Description |
|--------|-------------|
| **New Scan** | Trigger a new repository scan |
| **Refresh** | Reload current scan results |
| **Export** | Download artifact data as JSON |
| **Filter** | Apply filters to artifact list |

---

## Repository Tree

The Repository Tree provides a hierarchical view of your repository files.

### Navigation

- **Expand/Collapse**: Click folder icons to expand or collapse directories
- **Select File**: Click a file to view its content and metadata
- **Breadcrumb**: Use the breadcrumb trail to navigate back to parent folders

### File Information

For each file, the tree displays:
- **Name**: File or folder name
- **Type**: File extension (ts, yaml, md, etc.)
- **Size**: File size in bytes
- **Last Modified**: Timestamp of last modification
- **Detected Type**: Artifact type if detected (requirement, architecture, etc.)

### Lazy Loading

The Repository Tree uses lazy loading for performance:
1. Initial load shows only the tree structure (no file content)
2. File content loads on-demand when you click a file
3. Large repositories load quickly without overwhelming the browser

### Integration with Discovery Dashboard

- Click an artifact in the Discovery Dashboard to highlight it in the Repository Tree
- Click a file in the Repository Tree to view its artifact details (if detected)

---

## Artifact Viewer

The Artifact Viewer provides detailed information about a specific engineering artifact.

### Artifact Types

#### Requirements (`requirement`)

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (e.g., REQ-001) |
| **Title** | Short descriptive title |
| **Type** | functional, non-functional, system, user |
| **Priority** | low, medium, high, critical |
| **Status** | proposed, approved, rejected, implemented, verified |
| **Description** | Detailed requirement text |
| **Tags** | Categorization tags |
| **Trace Links** | Relationships to other artifacts |

#### Architecture Models (`architecture`)

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (e.g., ARCH-001) |
| **Name** | Model name |
| **Type** | blockDefinition, internalBlockDiagram, stateMachine, etc. |
| **Elements** | Architecture elements (blocks, ports, connectors) |
| **Relationships** | Element relationships (composition, aggregation, etc.) |

#### Architecture Decision Records (`adr`)

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (e.g., ADR-001) |
| **Title** | Decision title |
| **Status** | proposed, accepted, deprecated, superseded |
| **Deciders** | People who made the decision |
| **Context** | Background and problem statement |
| **Decision** | The decision made |
| **Consequences** | Outcomes and trade-offs |

#### Specifications (`spec`)

| Field | Description |
|-------|-------------|
| **Title** | Specification title |
| **Version** | Specification version |
| **Status** | draft, active, deprecated |
| **Requirements** | List of specification requirements |

---

## Graph Builder

The Graph Builder visualizes traceability relationships between artifacts.

### Graph Types

#### Full Traceability Graph

Shows all artifacts and their relationships:
- **Nodes**: Artifacts (colored by type)
- **Edges**: Trace links (styled by relationship type)

#### Filtered Graph

Filter the graph by:
- **Source Types**: Only show artifacts of certain types as sources
- **Target Types**: Only show artifacts of certain types as targets
- **Relationships**: Only show specific relationship types

#### Confidence-Sorted Graph

Sort edges by confidence level:
- **High confidence**: Solid lines, thicker weight
- **Medium confidence**: Dashed lines, medium weight
- **Low confidence**: Dotted lines, thin weight

### Interaction

- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Click and drag background
- **Select Node**: Click a node to view artifact details
- **Select Edge**: Click an edge to view trace link details
- **Highlight Path**: Double-click a node to highlight all connected paths

### Legend

| Symbol | Meaning |
|--------|---------|
| 🟦 | Requirement |
| 🟩 | Architecture Model |
| 🟨 | Software Component |
| 🟪 | Test Case |
| → | Satisfies |
| ➜ | Verifies |
| ⇢ | Depends On |

---

## Requirements-as-Code

Nexus supports managing requirements as code using YAML files.

### File Format

Requirements are stored in `.req.yaml` files:

```yaml
nexus:
  metadata:
    documentId: PRJ-REQ-001
    domain: authentication
    version: "1.0"

requirements:
  - id: REQ-AUTH-001
    type: functional
    title: User Authentication
    description: |
      The system shall authenticate users using
      email and password credentials.
    priority: high
    status: approved
    tags: [security, auth]
    
    traceLinks:
      - type: verifies
        target:
          id: TC-AUTH-001
          documentId: PRJ-TEST-001
        confidence: high
        description: "Authentication test case"
```

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nexus.metadata.documentId` | string | Yes | Unique document identifier |
| `nexus.metadata.domain` | string | No | Domain category |
| `requirements[].id` | string | Yes | Requirement identifier |
| `requirements[].type` | enum | Yes | functional, non-functional, system, user |
| `requirements[].title` | string | Yes | Short title |
| `requirements[].description` | string | Yes | Detailed description |
| `requirements[].priority` | enum | No | low, medium, high, critical |
| `requirements[].status` | enum | No | proposed, approved, rejected, implemented, verified |

### Trace Link Syntax

```yaml
traceLinks:
  - type: verifies | satisfies | dependsOn | tracesTo | refines | conflictsWith
    target:
      id: <target-artifact-id>
      documentId: <target-document-id>
    confidence: high | medium | low
    description: "Optional description"
```

### Validation

Nexus validates requirement files against the schema:
- **Syntax errors**: YAML parsing failures
- **Schema violations**: Missing required fields, invalid enum values
- **Trace validation**: Invalid target references, circular dependencies

Validation errors are displayed in the Discovery Dashboard and API responses.

---

## Traceability Links

Traceability links connect artifacts to show relationships.

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `satisfies` | Target satisfies source requirement | Component satisfies Requirement |
| `verifies` | Target verifies source | Test Case verifies Requirement |
| `dependsOn` | Source depends on target | Module dependsOn Library |
| `tracesTo` | Source traces to target | Requirement tracesTo Design |
| `refines` | Source refines target | Sub-requirement refines Parent |
| `conflictsWith` | Source conflicts with target | ADR conflictsWith ADR |

### Confidence Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `high` | Automated or expert-verified | Generated from code analysis |
| `medium` | Inferred with good evidence | Pattern-matched relationships |
| `low` | Speculative or unverified | AI-suggested relationships |

### Creating Trace Links

1. **Manual**: Use the Trace Links API to create relationships
2. **From Requirements**: Define in `.req.yaml` files using `traceLinks` field
3. **Automatic**: Nexus infers relationships during artifact parsing

### Viewing Trace Links

- **Discovery Dashboard**: View trace links for any artifact
- **Graph Builder**: Visualize all trace links as a graph
- **API**: Query trace links programmatically

---

## Troubleshooting

### Common Issues

#### Scan Fails with "Repository not found"

**Cause**: Invalid repository path  
**Solution**: Ensure the path is absolute or relative to the backend server's working directory

#### No Artifacts Detected

**Cause**: No recognized artifact files in repository  
**Solution**: Ensure you have `.req.yaml`, `.adr.yaml`, or `.spec.yaml` files

#### Trace Links Not Showing

**Cause**: Artifacts not yet processed  
**Solution**: Wait for the scan to complete; check artifact lifecycle state

#### Graph Empty

**Cause**: No trace links defined  
**Solution**: Add trace links in requirement files or via the API

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Scan failed: <reason>` | Repository scan error | Check repository path and permissions |
| `Artifact not found` | Invalid artifact ID | Verify artifact exists in registry |
| `Cannot transition lifecycle` | Invalid state change | Check allowed transitions for current state |
| `Trace link ID required` | Missing ID parameter | Provide valid trace link ID |

### Performance Tips

1. **Large Repositories**: Use scan options to limit depth or file patterns
2. **Many Artifacts**: Use pagination for list endpoints
3. **Complex Graphs**: Filter by artifact type or relationship type
4. **Slow Loading**: Use the tree-only endpoint for initial UI mount

---

## API Access

For programmatic access, see the [API Reference](./API_REFERENCE.md).

### Quick Start

```bash
# Scan a repository
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"repositoryPath": "."}'

# List all artifacts
curl http://localhost:3000/api/artifacts/registry

# Get traceability graph
curl http://localhost:3000/api/graph/traceability
```

---

## Support

- **Documentation**: See [docs/](./) directory
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Contract**: See [API_CONTRACT.md](./API_CONTRACT.md)
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
