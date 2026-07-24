# Nexus Engineering — Demo Script

**Purpose:** External demo walkthrough for stakeholders and potential customers  
**Duration:** 15-20 minutes  
**Audience:** Engineering leaders, DevOps teams, QA managers

---

## Pre-Demo Setup

```bash
# 1. Start the application
pnpm dev

# 2. Verify backend is running
curl http://localhost:3001/health

# 3. Open browser to frontend
open http://localhost:5173
```

---

## Demo Flow

### 1. Authentication & Onboarding (2 min)

**Goal:** Show easy setup and secure access

1. **Register new account**
   - Navigate to login page
   - Click "Register"
   - Enter: `demo@bikeapp.com` / `Demo1234!`
   - Show successful registration

2. **Create organization**
   - Enter org name: "Bike App Engineering"
   - Show automatic role assignment (admin)

**Talking Points:**
- OAuth support (Google/GitHub) available
- SAML v2 for enterprise SSO
- Role-based access control built-in

---

### 2. Repository Scanning (3 min)

**Goal:** Show automatic artifact discovery

1. **Navigate to Scanner**
   - Click "Scanner" in sidebar

2. **Scan demo directory**
   - Enter path: `./docs/demo`
   - Click "Scan"
   - Show discovered files and artifacts

3. **Review scan results**
   - Show file tree structure
   - Highlight artifact types detected:
     - Requirements (`.req.yaml`)
     - Architecture decisions (`.arch.yaml`)
     - Features (`.feature.yaml`)
     - Test results (`.ter.yaml`)

**Talking Points:**
- Automatic file type detection
- Multi-repo scanning support
- Configurable ignore patterns

---

### 3. Artifact Registry (3 min)

**Goal:** Show centralized artifact management

1. **Navigate to Artifact Registry**
   - Click "Artifact Registry" in sidebar

2. **Review discovered artifacts**
   - Show summary counts:
     - 10 Requirements
     - 3 Architecture Decision Records
     - 3 Features
     - 12 Test Executions

3. **Explore artifact details**
   - Click on a requirement to view full details
   - Show metadata, acceptance criteria, trace links
   - Show lifecycle state (discovered → parsed → indexed → related)

**Talking Points:**
- Centralized artifact management
- Automatic lifecycle tracking
- Rich metadata extraction

---

### 4. Traceability Graph (4 min)

**Goal:** Show end-to-end traceability

1. **Navigate to Graph Builder**
   - Click "Graph" in sidebar

2. **View full traceability graph**
   - Show nodes (requirements, ADRs, features, tests)
   - Show edges (satisfies, verifies, dependsOn)
   - Highlight trace chain: Requirement → ADR → Feature → Test

3. **Filter and explore**
   - Filter by artifact type
   - Filter by relationship type
   - Show confidence levels on links

4. **Show specific trace**
   - Click on "User Authentication" requirement
   - Show trace to: Auth ADR → SSO Login Feature → Test Results
   - Highlight 31 total trace links

**Talking Points:**
- Full bidirectional traceability
- Impact analysis capabilities
- Confidence scoring on relationships

---

### 5. Requirements as Code (2 min)

**Goal:** Show structured requirements management

1. **Navigate to Requirements**
   - Click "Requirements" in sidebar

2. **View requirement document**
   - Select authentication requirements
   - Show structured YAML format
   - Highlight acceptance criteria

3. **Show trace links**
   - Show which tests verify this requirement
   - Show which ADRs satisfy this requirement

**Talking Points:**
- Version-controlled requirements
- Automatic parsing and validation
- Direct traceability to implementation

---

### 6. Architecture Decisions (2 min)

**Goal:** Show ADR management

1. **Navigate to Architecture**
   - Show ADR for "Authentication Strategy"

2. **Review decision record**
   - Context and problem statement
   - Decision and rationale
   - Consequences and trade-offs

3. **Show trace links**
   - Links to requirements satisfied
   - Links to features implementing

**Talking Points:**
- Structured decision documentation
- Traceability to requirements
- Searchable decision history

---

### 7. Test Results Integration (2 min)

**Goal:** Show test traceability

1. **Navigate to Test Results**
   - Show test execution results
   - Highlight passed/flaky/failed counts

2. **View test details**
   - Show test case structure
   - Show trace links to requirements
   - Show coverage matrix

**Talking Points:**
- CI/CD integration ready
- Traceable test coverage
- Quality gate support

---

## Key Value Propositions (Throughout Demo)

1. **"Engineering as Code"**
   - All artifacts in Git-friendly YAML format
   - Version controlled alongside code
   - Reviewable in PRs

2. **Automatic Traceability**
   - No manual linking required
   - AI-powered relationship detection
   - Confidence scoring

3. **Enterprise Ready**
   - SSO (OAuth + SAML)
   - RBAC with organizations
   - Audit logging

4. **Developer Experience**
   - Fast scanning and indexing
   - Interactive graph visualization
   - RESTful API for integrations

---

## Closing (1 min)

### Summary

- **10 requirements** traced through the lifecycle
- **3 architecture decisions** linked to requirements
- **3 features** verified by tests
- **12 test executions** with coverage data
- **31 trace links** showing full end-to-end traceability

### Next Steps

- Schedule technical deep-dive
- Review API documentation
- discuss deployment options

---

## Troubleshooting

### Demo Data Not Loading

```bash
# Re-import demo data
node scripts/import-demo.cjs

# Or rescan via API
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"repositoryPath": "./docs/demo"}'
```

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :3001
lsof -i :5173

# Kill conflicting processes if needed
kill -9 <PID>
```

### Database Issues

```bash
# Reset database (if using file-based SQLite)
rm -f ./data/nexus.db
pnpm dev
```

---

**Last Updated:** 2026-07-24  
**Maintainer:** Backend Architect
