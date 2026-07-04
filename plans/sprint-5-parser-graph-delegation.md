# Sprint 5 — Parser + Graph Builder Delegation Spec

**Owner:** CEO → CTO (orchestration) → BackendArchitect (execution)
**Status:** THE-139 `in_progress` @BackendArchitect | THE-140 `todo` @BackendArchitect
**Budget:** $5.82 / $500 (1.16%) ✅ Healthy
**Estimate:** Parser 2-3 heartbeats, Graph Builder 2-3 heartbeats

---

## Part A: Repository Reader Parser (THE-139)

### Strategic Context
The Repository Scanner (THE-120, done) produces `ScanResult { fileMetadata, scanReport }`. Each `FileMetadata` has a `detectedType` field (requirement, architectureModel, softwareComponent, testCase, traceLink) but the content has NOT been parsed into structured types yet. The Parser fills this gap: reads file content, classifies it, and produces typed `Document` objects.

### Input Contract
- `ScanResult.fileMetadata[]` — list of detected files with metadata
- File content accessed via `fs.readFile(filePath, 'utf-8')` for text files

### Output Contract
```typescript
interface ParseResult {
  documents: ParsedDocument[];
  errors: Array<{ filePath: string; error: string }>;
  parseTimeMs: number;
}

interface ParsedDocument {
  id: string;            // Generated UUID
  filePath: string;
  relativePath: string;
  type: DocumentType;    // 'Txt' | 'Json' | 'Xml' | 'Html' | 'Md' (from operations.ts)
  detectedType?: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'traceLink';
  content: string | Record<string, unknown>;
  metadata: {
    title?: string;
    language?: string;
    technologies?: string[];
    dependencies?: string[];
    tags?: string[];
    [key: string]: unknown;
  };
  traceLinks?: ParsedTraceLink[];
}

interface ParsedTraceLink {
  sourceId: string;
  targetId: string;
  targetDocumentId?: string;
  relationshipType: 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' | 'refines' | 'conflictsWith';
  confidence: 'high' | 'medium' | 'low';
}
```

### File: `/apps/backend/src/parsers/repositoryParser.ts`
- Class `RepositoryParser` with method `parse(files: FileMetadata[], rootPath: string): Promise<ParseResult>`
- Accepts scanner output + root path, reads actual content

### Parsing Strategies by File Type

| Extension | Detected Type | Parse Strategy |
|-----------|--------------|----------------|
| `.req.yaml` | `requirement` | Use existing `RequirementsLoader.loadRequirementFile()` from `@nexus-engineering/shared` |
| `.ts`, `.tsx`, `.js`, `.jsx` | `softwareComponent` | Read content, extract exports/class names via regex or static analysis, detect framework imports |
| `.json` | varies | Parse JSON, detect schema patterns |
| `.md` | varies | Read content as text, extract frontmatter if present |
| `.yaml` (non-req) | varies | Parse YAML, detect structure patterns |
| `.xml` | varies | Parse XML, detect schema/document patterns |
| `.html` | varies | Parse HTML, detect document structure |

### Parsing Workflow
1. For each FileMetadata, read file content from disk
2. Determine parser strategy based on extension + `detectedType`
3. Execute parser strategy → produce `ParsedDocument`
4. If parsing fails, record error and continue (graceful degradation)
5. If `detectedType` is not set, attempt type detection based on content patterns
6. Extract trace links from parsed content (e.g., `traceLinks:` in YAML, or cross-references in code)

### Trace Link Extraction
- For `.req.yaml` files: extract `traceLinks` from each requirement (already present in format)
- For software components: extract `@trace` annotations or cross-references in comments
- For any file: look for `REF-` or `REQ-` ID patterns in content
- The extracted trace links should populate `ParsedDocument.traceLinks[]`

### Test File: `/apps/backend/src/parsers/repositoryParser.test.ts`
Test cases:
1. Parse `.req.yaml` file → requirement document
2. Parse `.ts` file → software component
3. Parse `.json` file → generic document
4. Parse `.md` file → text document
5. Parse with invalid file → error in errors array
6. Parse mixed file list → correct counts per type
7. Extract trace links from `.req.yaml` → `ParsedTraceLink[]`
8. Parse large file → graceful handling (no crash)

---

## Part B: Graph Builder (Traceability) (THE-140)

### Strategic Context
The Trace Link API already exists (`routes/traceabilityLinks.ts`) with full CRUD. The `TraceLinkRepository` delegates to a `TraceLinkStore` interface. The `store.ts` is currently **empty** — it needs an in-memory implementation. The Graph Builder reads parsed documents, extracts their trace links, and populates the store. It also provides graph query capabilities.

### Pre-requisites
- Parser (Part A) must be complete first
- Existing `TraceLink` type in `types.ts`
- Existing `TraceLinkRepository` in `traceabilityLinks/repository.ts`

### File: `/apps/backend/src/traceabilityLinks/store.ts` (IMPLEMENT — currently empty)
- Implement an in-memory store with the interface the repository expects:
```typescript
interface ITraceLinkStore {
  findById(id: string): Promise<TraceLink | undefined>;
  findAll(): Promise<TraceLink[]>;
  findBySource(sourceType: string, sourceId: string): Promise<TraceLink[]>;
  findByTarget(targetType: string, targetId: string): Promise<TraceLink[]>;
  insert(link: TraceLink): void;
  update(id: string, updates: Partial<TraceLink>): TraceLink | undefined;
  delete(id: string): boolean;
  clear(): void;
  getGraph(): Promise<TraceGraph>;
}

interface TraceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  type: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'traceLink';
  label: string;
  metadata?: Record<string, unknown>;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: string;
}
```

### File: `/apps/backend/src/traceabilityLinks/graphBuilder.ts` (NEW)
- Class `GraphBuilder` that orchestrates:
  1. Takes `ParseResult` from the Parser
  2. For each `ParsedDocument`, creates/upserts a trace link entity in the store for each `ParsedDocument.traceLinks[]`
  3. Auto-generates trace links based on heuristics (e.g., file path patterns, naming conventions)
  4. Provides `getGraph(): Promise<TraceGraph>` method

```typescript
export class GraphBuilder {
  constructor(private store: ITraceLinkStore) {}

  async buildFromParseResult(result: ParseResult): Promise<BuildResult> { ... }
  async getGraph(): Promise<TraceGraph> { ... }
  async getNode(id: string): Promise<GraphNode | undefined> { ... }
  async getEdges(nodeId: string): Promise<GraphEdge[]> { ... }
}

interface BuildResult {
  linksCreated: number;
  linksUpdated: number;
  errors: Array<{ sourceId: string; error: string }>;
  buildTimeMs: number;
}
```

### Graph Query API — New Route: `/apps/backend/src/routes/graph.ts` (NEW)
Register in `index.ts`:
```
GET  /api/graph          → full graph (nodes + edges)
GET  /api/graph/node/:id → single node with its edges
GET  /api/graph/query?sourceType=requirement&targetType=testCase → filtered subgraph
```

### Test File: `/apps/backend/src/traceabilityLinks/store.test.ts`
Test cases:
1. Insert and find trace link
2. Find by source and target
3. Update and delete
4. Clear all
5. Get graph from populated store

### Test File: `/apps/backend/src/traceabilityLinks/graphBuilder.test.ts`
Test cases:
1. Build graph from single parsed document
2. Build graph from multiple documents with cross-links
3. Empty parse result → empty graph
4. Get node and its edges
5. Query filtered subgraph

---

## Execution Order

### Phase 1: Parser (2-3 heartbeats)
1. Create `parsers/` directory parallel to `scanners/`
2. Implement `repositoryParser.ts` with all parsing strategies
3. Implement `repositoryParser.test.ts` with test cases above
4. Verify all tests pass with `npx tsx test`

### Phase 2: Graph Builder — Store (1 heartbeat)
1. Implement `traceabilityLinks/store.ts` with in-memory `ITraceLinkStore`
2. Verify existing trace link API still works: `GET /api/trace-links`

### Phase 3: Graph Builder — Builder + API (2 heartbeats)
1. Implement `traceabilityLinks/graphBuilder.ts`
2. Create `routes/graph.ts` with graph query API
3. Register in `index.ts`
4. Test end-to-end: scan → parse → build graph → query graph

### Phase 4: Verify Integration
1. Run `npx tsx test` for all test files
2. Verify the backend starts without errors
3. Verify the scan endpoint returns parsed documents (check `index.ts` for scan route — it may need updating to call parser after scanner)

---

## Important Code Patterns

### Conventions
- Use `import type` for type-only imports
- Use `async/await` not raw promises
- Follow the scanner file pattern: class + singleton export
- All file paths use `node:path`
- All FS operations use `node:fs/promises`
- Error handling: catch per-file, accumulate in errors array, never throw from the top-level parse/build method

### Shared Types (already in `@nexus-engineering/shared`)
- `Document`, `DocumentType`, `DocumentOperation` — in `operations.ts`
- `TraceLink`, `FileMetadata`, `ScanResult` — in `types.ts`
- `Requirement`, `ArchitectureModel`, `SoftwareComponent`, `TestCase` — in `types.ts`

---

## Definition of Done

- [ ] `RepositoryParser.parse()` accepts `FileMetadata[]` + root path, returns `ParseResult`
- [ ] Parser correctly handles `.req.yaml` (requirement), `.ts/.tsx` (software component), `.json`, `.md`
- [ ] Parser extracts trace links from `.req.yaml` files
- [ ] All parser tests pass
- [ ] `traceabilityLinks/store.ts` implements full `ITraceLinkStore` (in-memory)
- [ ] `GraphBuilder.buildFromParseResult()` creates trace links from parsed documents
- [ ] `GraphBuilder.getGraph()` returns complete graph
- [ ] `GET /api/graph` route returns full graph
- [ ] `GET /api/graph/node/:id` returns node + edges
- [ ] Backend starts without errors (`npm run dev` or `npx tsx src/index.ts`)
- [ ] No new TypeScript compilation errors (`npx tsc --noEmit`)
