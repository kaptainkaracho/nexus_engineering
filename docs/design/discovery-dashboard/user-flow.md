# Discovery Dashboard — User Flow

## Primary Navigation

```mermaid
graph TD
    A[App Shell] -->|hash: #discovery| B[Discovery Dashboard]
    
    B --> C[Scan Overview]
    B --> D[Artifact Browser]
    B --> E[System Health]
    
    C -->|Click artifact type card| D
    C -->|Click "Run Scan"| F[Scan Triggered]
    F -->|Auto-refresh /poll| C
    
    D -->|Click artifact row| G[Artifact Detail Panel]
    D -->|Filter by type| D
    D -->|Filter by lifecycle| D
    D -->|Click "Open in Repository Tree"| H[Repository Tree View]
    D -->|Click "Open in Graph Builder"| I[Graph Builder View]
    
    G -->|Click file path| H
    G -->|Click "View Traceability"| I
    G -->|Click "Reparse"| F
    
    E -->|Click artifact type| D
    E -->|Click error count| D (filtered to error)
```

## User Journey: First-Time Use

```mermaid
sequenceDiagram
    actor User
    participant Dashboard as Discovery Dashboard
    participant Scanner as Repository Scanner
    participant Registry as Artifact Registry

    User->>Dashboard: Navigate to #discovery
    Dashboard->>Scanner: GET /api/scan (check last scan)
    Scanner-->>Dashboard: No scans found
    Dashboard->>User: Show empty state + "Run First Scan" CTA
    
    User->>Dashboard: Click "Run First Scan"
    Dashboard->>Scanner: POST /api/scan
    Scanner-->>Dashboard: 202 Accepted (scanId)
    
    loop Polling (every 2s)
        Dashboard->>Scanner: GET /api/scan/:id
        Scanner-->>Dashboard: status: running, filesFound: N
        Dashboard->>User: Update progress indicator
    end
    
    Scanner-->>Dashboard: status: completed
    Dashboard->>Registry: GET /api/artifacts/registry
    Registry-->>Dashboard: {total, byType, byLifecycle}
    Dashboard->>User: Render overview cards
```

## User Journey: Daily Use

```mermaid
sequenceDiagram
    actor User
    participant Dashboard as Discovery Dashboard
    participant Registry as Artifact Registry

    User->>Dashboard: Navigate to #discovery
    Dashboard->>Registry: GET /api/artifacts/registry
    Registry-->>Dashboard: {total: 47, byType, byLifecycle}
    Dashboard->>User: Show overview (last scan: 2h ago)
    
    User->>Dashboard: Click "Requirements" type card
    Dashboard->>Registry: GET /api/artifacts/registry/type/requirement
    Registry-->>Dashboard: [artifacts...]
    Dashboard->>User: Filtered artifact list
    
    User->>Dashboard: Click artifact row
    Dashboard->>User: Detail panel slides in (right side)
    Note over User: File path, lifecycle state,<br/>metadata, error history
    
    User->>Dashboard: Click "Open in Repository Tree"
    Dashboard->>User: Navigate to #repository, highlight file
```

## Navigation Integration

| From | To | Trigger |
|------|----|---------|
| Discovery Dashboard | Repository Tree | Click file path / "Open in Repository Tree" |
| Discovery Dashboard | Graph Builder | Click "View Traceability" / "Open in Graph Builder" |
| Repository Tree | Discovery Dashboard | Click artifact badge on file |
| Graph Builder | Discovery Dashboard | Click artifact node → detail |
| Nav bar | Discovery Dashboard | Click "Discovery" tab (new nav item) |

## States & Transitions

| State | Condition | UI |
|-------|-----------|-----|
| Empty | No scans ever | Illustration + "Run First Scan" CTA |
| Idle | Last scan complete, no active scan | Overview cards, "Run Scan" button enabled |
| Scanning | POST /scan returned 202 | Progress bar, animated pulse, button disabled |
| Error | Scan or parse failed | Error banner, error count card highlighted |
| Loading | Initial mount / filter change | Skeleton cards (3-column grid) |

## Design Lens References

- **Progressive Disclosure**: Overview → Browser → Detail. Each level reveals more without overwhelming.
- **Fitts's Law**: "Run Scan" button is a large primary CTA in the top-right of overview — high target area.
- **Jakob's Law**: Tab-based navigation matches existing ArtifactViewer pattern.
- **Recognition over Recall**: Status badges use color + text labels, not color alone.
- **Information Scent**: Type cards in overview show counts — user knows before clicking how many items they'll find.
