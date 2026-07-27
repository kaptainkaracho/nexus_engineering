#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# create-sprint-release.sh
# Creates a sprint release branch from develop
# and tags it for deployment.
#
# Usage:
#   ./scripts/create-sprint-release.sh <sprint-number> [version]
#
# Examples:
#   ./scripts/create-sprint-release.sh 26
#   ./scripts/create-sprint-release.sh 26 v0.2.0
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SPRINT_NUM="${1:-}"
VERSION="${2:-}"

if [ -z "$SPRINT_NUM" ]; then
  echo "Usage: $0 <sprint-number> [version]"
  echo "Example: $0 26 v0.2.0"
  exit 1
fi

RELEASE_BRANCH="release/sprint-${SPRINT_NUM}"

cd "$REPO_ROOT"

# Ensure we're on develop and up to date
echo "=== Checking out develop and pulling latest ==="
git checkout develop
git pull origin develop

# Create the release branch
echo "=== Creating release branch: ${RELEASE_BRANCH} ==="
git checkout -b "$RELEASE_BRANCH"

# Tag if version provided
if [ -n "$VERSION" ]; then
  echo "=== Tagging ${VERSION} ==="
  git tag -a "$VERSION" -m "Sprint ${SPRINT_NUM} release: ${VERSION}"
  echo "Tag ${VERSION} created (not pushed). Push with:"
  echo "  git push origin ${VERSION}"
fi

echo ""
echo "=== Done ==="
echo "Branch: ${RELEASE_BRANCH}"
echo ""
echo "Next steps:"
echo "  1. Run final validation: ./scripts/validate-local.sh"
echo "  2. Push branch: git push origin ${RELEASE_BRANCH}"
echo "  3. Create PR from ${RELEASE_BRANCH} into main"
echo "  4. After merge, push tag: git push origin ${VERSION}"
echo "  5. Merge release back to develop: git checkout develop && git merge ${RELEASE_BRANCH}"
