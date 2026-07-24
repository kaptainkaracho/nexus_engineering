#!/usr/bin/env bash
set -euo pipefail

# Setup E2E test dependencies for Playwright browsers.
# Run with sudo: sudo bash scripts/setup-e2e.sh

echo "Installing Playwright browser dependencies..."

if command -v npx &>/dev/null; then
    npx playwright install-deps
    echo "✅ System dependencies installed."
else
    echo "❌ npx not found. Install Node.js first."
    exit 1
fi

echo "Installing Playwright browsers..."
cd apps/frontend && pnpm exec playwright install --with-deps chromium firefox webkit

echo "✅ E2E setup complete."
