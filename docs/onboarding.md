# Nexus Engineering — Customer Onboarding Guide

**Last Updated:** 2026-07-28
**Version:** 1.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Step 1: Sign Up](#step-1-sign-up)
4. [Step 2: Connect a Repository](#step-2-connect-a-repository)
5. [Step 3: Run Your First Scan](#step-3-run-your-first-scan)
6. [Step 4: Explore Your Traceability Graph](#step-4-explore-your-traceability-graph)
7. [Step 5: Invite Your Team](#step-5-invite-your-team)
8. [Next Steps](#next-steps)

---

## Introduction

Nexus Engineering gives your team **end-to-end traceability** from requirements through architecture to implementation and testing — all managed as code in your Git repository.

This guide walks you through the first 30 minutes with Nexus. By the end, you will have a live traceability graph connecting your requirements, architecture decisions, and test cases.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Git repository | Any repo with engineering artifacts (YAML, Markdown, or code comments) |
| Node.js | 20+ (for self-hosted deployment) |
| Browser | Chrome, Firefox, or Edge (latest) |
| Admin access | To the repository you want to scan |

---

## Step 1: Sign Up

1. Navigate to the Nexus instance (or deploy your own — see [Deployment Guide](DEPLOYMENT.md))
2. Click **"Get Started"** on the landing page
3. Click **"Register"** on the login page
4. Enter your email, a password (8+ characters), and a display name
5. Click **"Create Account"**

You are now logged in with a `viewer` role.

---

## Step 2: Connect a Repository

1. Navigate to **Settings → Organizations**
2. Click **"Create Organization"**
3. Enter a name (e.g., "My Team") and a slug (e.g., `my-team`)
4. You are automatically added as an `org:admin`
5. From the dashboard, go to **Scan → New Scan**
6. Enter your repository URL or local path
7. Click **"Start Scan"**

Nexus will discover and classify all engineering artifacts in the repository automatically.

---

## Step 3: Run Your First Scan

1. Open the **Discovery Dashboard**
2. Click **"New Scan"**
3. Enter your repository path or Git URL
4. Wait for the scan to complete (typically 10–60 seconds for a standard repo)

After the scan completes, the dashboard displays all detected artifacts organized by type:

- **Requirements** — functional, non-functional, system, user
- **Architecture Models** — block definitions, diagrams, state machines
- **ADRs** — Architecture Decision Records
- **Specifications** — detailed specification documents
- **Test Cases** — test execution results and trace links

---

## Step 4: Explore Your Traceability Graph

1. Go to **Graph Builder** in the navigation
2. You will see nodes (requirements, ADRs, features, test cases) connected by edges
3. Each edge represents a trace link with a confidence level (high, medium, low)
4. Click a node to see its artifact details and linked relationships

### Interaction Guide

| Action | How |
|--------|-----|
| Zoom | Mouse wheel or pinch gesture |
| Pan | Click and drag background |
| Select a node | Click node to view details |
| Find paths | Double-click a node to highlight all connected paths |
| Filter by type | Click artifact type tabs in the legend |
| Sort edges | Hover over edges to see confidence level |

---

## Step 5: Invite Your Team

1. Go to **Settings → Organizations**
2. Select your organization
3. Click **"Invite Member"**
4. Enter the team member's email address
5. Assign a role (`viewer`, `editor`, or `org:admin`)
6. The invitee receives an email with a link to join

### Roles at a Glance

| Role | Permissions |
|------|-------------|
| **Viewer** | Read-only access to artifacts, graphs, and trace links |
| **Editor** | Create and edit artifacts, manage trace links |
| **Org Admin** | Full organization control, manage members, configure services |

---

## Next Steps

| Resource | What You'll Learn |
|----------|-------------------|
| [Quickstart Tutorial](quickstart.md) | Hands-on walkthrough: setup → scan → explore → demo |
| [Deployment Guide](DEPLOYMENT.md) | Deploy Nexus to Railway in one click |
| [API Reference](API_REFERENCE.md) | Programmatic access to all Nexus features |
| [Developer Guide](DEVELOPER_GUIDE.md) | Contributing and extending Nexus |
| [Demo Project](demo/) | Pre-built demo with sample traceability data |

### Try It Now

```bash
# Clone and run Nexus locally
git clone <repository-url>
cd nexus-engineering
pnpm install
pnpm dev

# Import demo data for a quick first experience
node scripts/import-demo.js

# Open the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Health Check: http://localhost:3001/health
```

---

## Common Tasks

### Import Sample Data

Use the demo project to explore features without connecting a real repository:

```bash
node scripts/import-demo.js
```

This populates the database with a fictional "Bike App" project containing:
- Authentication module requirements and tests
- Audit log module with trace links
- Architecture decisions and feature documents

### Re-Scan a Repository

If you make changes to your repository and want to update the traceability graph:
1. Go to **Discovery Dashboard**
2. Click **"Refresh"** or **"New Scan"**
3. Nexus will re-index the repository and update all artifacts and links

### Export Artifacts

Navigate to any artifact list and click **"Export"** to download the data as JSON for reporting or integration with other tools.

---

## Support

- **Documentation:** [docs/](./)
- **Issues:** Open an issue in the Nexus repository
- **API Help:** See [API Reference](API_REFERENCE.md)

---

**Last updated:** 2026-07-28 | THE-405
