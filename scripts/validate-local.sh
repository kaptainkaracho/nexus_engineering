#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# validate-local.sh
# Runs lint, typecheck, tests, and build locally
# before pushing. Exit code is non-zero on any
# failure so it can be used as a pre-push hook.
#
# Usage:
#   ./scripts/validate-local.sh          # full validation
#   ./scripts/validate-local.sh --fast   # skip build
#   ./scripts/validate-local.sh --lint-only
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-full}"

cd "$REPO_ROOT"

echo "=========================================="
echo "  Local Build Validation"
echo "  Mode: ${MODE}"
echo "=========================================="

failures=0

run_step() {
  local step_name="$1"
  shift
  echo ""
  echo "--- [${step_name}] ---"
  if "$@"; then
    echo "  ✓ ${step_name} passed"
  else
    echo "  ✗ ${step_name} FAILED"
    failures=$((failures + 1))
  fi
}

case "$MODE" in
  --lint-only)
    run_step "Lint" pnpm lint
    ;;
  --fast)
    run_step "Lint" pnpm lint
    run_step "Typecheck" pnpm typecheck
    run_step "Test (unit)" pnpm test
    ;;
  *)
    run_step "Lint" pnpm lint
    run_step "Typecheck" pnpm typecheck
    run_step "Test (unit)" pnpm test
    run_step "Build" pnpm build
    ;;
esac

echo ""
echo "=========================================="
if [ $failures -eq 0 ]; then
  echo "  ✅ All checks passed"
else
  echo "  ❌ ${failures} step(s) failed"
fi
echo "=========================================="
exit $failures
