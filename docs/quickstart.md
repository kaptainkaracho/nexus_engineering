# Nexus Engineering — Quickstart Tutorial

**Last Updated:** 2026-07-28  
**Version:** 1.1

---

Welcome! This guide walks you through your first experience with Nexus Engineering — from setup to exploring traceability links. You will be up and running in under 5 minutes.

---

## Choose Your Path

| Path | Time | Best For |
|------|------|----------|
| **Try in the Cloud** | 2 min | Preview Nexus without installing anything |
| **Local Dev** | 5 min | Developers who want to run Nexus locally |
| **Demo Import** | 3 min | Explore with pre-built sample data |

---

## Option A: Try It in the Cloud

Deploy Nexus to Railway with one click and skip local setup entirely.

1. Click **[Deploy to Railway](https://railway.app/new/template?templateRepo=https://github.com/TheBikeApp/Nexus)**
2. Wait ~2 minutes for the build to complete
3. Open the generated URL to access Nexus
4. Create your account and start your first scan

No CLI, no configuration, no credit card required.

---

## Option B: Local Development

### Step 1: Install Prerequisites

```bash
node --version   # Node.js 20+ required
pnpm --version   # pnpm 9+ required
```

### Step 2: Clone and Install

```bash
git clone <repository-url>
cd nexus-engineering
pnpm install
```

### Step 3: Start the Application

```bash
pnpm dev
```

Open http://localhost:5173 in your browser. You should see the Nexus Engineering landing page.

---

## Step 4: Create Your Account

1. Click **"Get Started"** on the landing page
2. Click **"Register"** on the login page
3. Enter your email, a password (8+ characters), and display name
4. Click **"Create Account"**

You are now logged in with a `viewer` role. Your JWT access token is valid for 15 minutes.

---

## Step 5: Explore the Dashboard

The main dashboard shows:

- **Repository Tree** — Browse scanned files and artifacts
- **Artifact Registry** — See all discovered engineering artifacts
- **Graph View** — Visualize traceability links between artifacts
- **Trace Links** — Browse and manage trace relationships

---

## Step 6: Scan a Repository

1. Navigate to the **Scanner** view
2. Enter a repository path (try the demo data):
   ```
   docs/demo
   ```
3. Click **"Scan"**
4. Browse the detected artifacts: requirements, architecture decisions, features, test results

---

## Step 7: View Trace Links

1. Go to the **Graph Builder** view
2. You'll see nodes (requirements, ADRs, features, test cases) connected by edges
3. Each edge represents a trace link with a confidence level (high, medium, low)
4. Click a node to see details and linked artifacts

---

## Step 8: Import Demo Project (Optional)

For a richer starting point, import the pre-built demo project:

```bash
node scripts/import-demo.js
```

This populates the database with sample requirements, features, ADRs, test results, and trace links. The demo project represents a fictional "Bike App" with:

- **Authentication module** — login, session management, password policy
- **Audit Log module** — event capture, query, retention
- **Artifact Registry module** — upload, download, metadata management

---

## Step 9: Create an Organization

1. Go to **Settings → Organizations**
2. Click **"Create Organization"**
3. Enter a name (e.g., "My Team") and slug (e.g., "my-team")
4. You are automatically added as an `org:admin`
5. Invite other users or assign roles

---

## Step 10: Check the Audit Log

1. Go to **Settings → Audit Log**
2. Filter by action type (LOGIN, CREATE, UPDATE, DELETE)
3. Filter by date range or organization
4. Export logs as CSV for compliance reporting

---

## Option C: One-Click Deploy for Teams

For teams who want to get Nexus running in production:

```bash
# Deploy to Railway (requires Railway CLI)
railway login
railway init
railway up
```

See the full [Deployment Guide](DEPLOYMENT.md) for production deployment, CI/CD configuration, and environment variables.

---

## What's Next?

| Resource | Description |
|----------|-------------|
| [Onboarding Guide](onboarding.md) | Customer-focused first 30 minutes with Nexus |
| [Setup Guide](SETUP_GUIDE.md) | Full installation and configuration |
| [API Reference](API_REFERENCE.md) | Complete API documentation |
| [Developer Guide](DEVELOPER_GUIDE.md) | Contributing and development workflow |
| [Architecture](ARCHITECTURE.md) | System architecture deep-dive |
| [Demo Project](demo/) | Pre-built demo with seed data |
| [Deployment Guide](DEPLOYMENT.md) | Production deployment to Railway (one-click) |

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

---

**Last updated:** 2026-07-28 | THE-405
