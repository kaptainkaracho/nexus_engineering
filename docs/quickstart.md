# Nexus Engineering — Quickstart Tutorial

**Last Updated:** 2026-07-19

---

Welcome! This guide walks you through your first experience with Nexus Engineering — from setup to exploring traceability links.

---

## Step 1: Start the Application

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser. You should see the Nexus Engineering landing page.

---

## Step 2: Create Your Account

1. Click **"Get Started"** on the landing page
2. Click **"Register"** on the login page
3. Enter your email, a password (8+ characters), and display name
4. Click **"Create Account"**

You are now logged in with a `viewer` role. Your JWT access token is valid for 15 minutes.

---

## Step 3: Explore the Dashboard

The main dashboard shows:

- **Repository Tree** — Browse scanned files and artifacts
- **Artifact Registry** — See all discovered engineering artifacts
- **Graph View** — Visualize traceability links between artifacts
- **Trace Links** — Browse and manage trace relationships

---

## Step 4: Scan a Repository

1. Navigate to the **Scanner** view
2. Enter a repository path (try the demo data):
   ```
   docs/demo
   ```
3. Click **"Scan"**
4. Browse the detected artifacts: requirements, architecture decisions, features, test results

---

## Step 5: View Trace Links

1. Go to the **Graph Builder** view
2. You'll see nodes (requirements, ADRs, features, test cases) connected by edges
3. Each edge represents a trace link with a confidence level (high, medium, low)
4. Click a node to see details and linked artifacts

---

## Step 6: Import Demo Project (Optional)

For a richer starting point, import the pre-built demo project:

```bash
node scripts/import-demo.js
```

This populates the database with sample requirements, features, ADRs, test results, and trace links. The demo project represents a fictional "Bike App" with:

- **Authentication module** — login, session management, password policy
- **Audit Log module** — event capture, query, retention
- **Artifact Registry module** — upload, download, metadata management

---

## Step 7: Create an Organization

1. Go to **Settings → Organizations**
2. Click **"Create Organization"**
3. Enter a name (e.g., "My Team") and slug (e.g., "my-team")
4. You are automatically added as an `org:admin`
5. Invite other users or assign roles

---

## Step 8: Check the Audit Log

1. Go to **Settings → Audit Log**
2. Filter by action type (LOGIN, CREATE, UPDATE, DELETE)
3. Filter by date range or organization
4. Export logs as CSV for compliance reporting

---

## Next Steps

| Resource | Description |
|----------|-------------|
| [Setup Guide](SETUP_GUIDE.md) | Full installation and configuration |
| [API Reference](API_REFERENCE.md) | Complete API documentation |
| [Developer Guide](DEVELOPER_GUIDE.md) | Contributing and development workflow |
| [Architecture](ARCHITECTURE.md) | System architecture deep-dive |
| [Demo Project](demo/) | Pre-built demo with seed data |
| [Deployment Guide](DEPLOYMENT.md) | Production deployment to Railway |

---

## Quick Reference

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm test                   # Run tests
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint

# Demo
node scripts/import-demo.js # Import demo project

# Deployment
pnpm build                  # Production build
railway up                  # Deploy to Railway
```
