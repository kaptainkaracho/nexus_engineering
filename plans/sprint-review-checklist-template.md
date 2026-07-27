# Sprint <N> Review Checklist

**Sprint:** <N>
**Date:** <date>
**Author:** <name>

## 1. Release Branch
- [ ] Create `release/sprint-<N>` from `develop`
  ```bash
  ./scripts/create-sprint-release.sh <N>
  ```
- [ ] Push release branch to origin
  ```bash
  git push origin release/sprint-<N>
  ```

## 2. Local Build Verification
- [ ] Fresh checkout of release branch
  ```bash
  git checkout release/sprint-<N>
  ```
- [ ] Copy .env.example → .env, fill any required secrets
- [ ] Run full local stack
  ```bash
  ./scripts/run-local.sh
  ```
- [ ] Backend healthcheck: `curl http://localhost:3001/health` → `{"status":"ok"}`
- [ ] Frontend loads at http://localhost:5173
- [ ] Run validation
  ```bash
  ./scripts/validate-local.sh --fast
  ```

## 3. Issue Completion
- [ ] All sprint execution issues closed
- [ ] UX Gate sign-off received for all frontend issues
- [ ] No open blockers for sprint scope

## 4. Release PR
- [ ] Create PR from `release/sprint-<N>` into `main`
- [ ] CI checks pass on the release PR
- [ ] Merge PR → auto-deploy to Railway

## 5. Post-Release
- [ ] Tag release
  ```bash
  git tag v<X.Y.Z> release/sprint-<N>
  git push origin v<X.Y.Z>
  ```
- [ ] Merge release back to `develop`
  ```bash
  git checkout develop
  git merge release/sprint-<N>
  git push origin develop
  ```
- [ ] Archive sprint plan
- [ ] Update HEARTBEAT.md with sprint delivery metrics
- [ ] Present delivery metrics to board
