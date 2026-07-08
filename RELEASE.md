# Release Process

This document explains how to create a release for BC Wallet Demo.

## Release Overview

The BC Wallet Demo has two independent versioning tracks:

1. **Application Version** (`package.json`): Version of the Node.js application (frontend + server)
2. **Helm Chart Version** (`charts/showcase/Chart.yaml`): Version of the Kubernetes Helm chart for deployment

Both versions follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

## What Gets Published

When you create a GitHub Release:

- **Docker Images** → Published to GitHub Container Registry (GHCR)
  - `ghcr.io/bcgov/bc-wallet-showcase-server:<version>`
  - `ghcr.io/bcgov/bc-wallet-showcase-frontend:<version>`
  - Multi-platform: linux/amd64, linux/arm64

- **Helm Chart** → Published to GitHub Pages
  - Repository: `https://bcgov.github.io/BC-Wallet-Demo`
  - **Only publishes if `Chart.yaml` version is new** (not a duplicate)

## Prerequisites

- Write access to the repository
- Docker images must successfully build (runs Cypress E2E tests first)
- `Chart.yaml` version must be bumped from the previous release

## Release Steps

### 1. Create a Release Branch (Optional but Recommended)

```bash
git checkout -b release/v0.2.0
```

### 2. Bump Versions

Update both version files to the new version:

**`package.json`** (update the `version` field):
```json
{
  "name": "bc-wallet-demo",
  "version": "0.2.0",
  ...
}
```

**`charts/showcase/Chart.yaml`** (update the `version` field):
```yaml
apiVersion: v2
name: showcase
version: 0.5.0
appVersion: '1.0.0'
...
```

> **Note:** `Chart.yaml` version and `package.json` version are independent. You may update them at different rates depending on your release strategy.

### 3. Commit Changes

```bash
git add package.json charts/showcase/Chart.yaml
git commit -m "chore(release): bump versions to v0.2.0"
```

### 4. Push and Create Pull Request

```bash
git push origin release/v0.2.0
```

Create a pull request on GitHub. This triggers:
- Unit tests (server + frontend)
- Cypress E2E tests
- Helm chart lint

Wait for CI to pass ✅

### 5. Create GitHub Release

On GitHub, go to [Releases](https://github.com/bcgov/BC-Wallet-Demo/releases) and click **"Create a new release"**:

1. **Tag version**: Enter the version (e.g., `v0.2.0`)
2. **Target**: Select the release branch (or `main` if committing directly)
3. **Title**: `Release v0.2.0` (or descriptive title)
4. **Description**: Add release notes describing changes
5. **Set as latest release**: Check this (unless it's a pre-release)
6. Click **"Publish release"**

### 6. Verify Release

Both workflows should trigger automatically:

#### a. Verify Docker Images
- Go to [GHCR packages](https://github.com/bcgov/bc-wallet-demo/pkgs/container)
- Check `bc-wallet-showcase-server` and `bc-wallet-showcase-frontend` have new tags with the version

#### b. Verify Helm Chart Published
- Go to [GitHub Pages Helm repo](https://bcgov.github.io/BC-Wallet-Demo)
- Add the repo and search:
  ```bash
  helm repo add bc-wallet-showcase https://bcgov.github.io/BC-Wallet-Demo
  helm repo update
  helm search repo bc-wallet-showcase
  ```
- Confirm the new chart version appears

## Troubleshooting

### Docker Build Failed

Check the `build_packages.yml` workflow logs:
- Cypress tests may have failed
- Docker build may have failed
- Fix the issue, update versions if needed, and create a new release tag

### Helm Chart Not Published

The `helm-release-showcase.yaml` workflow will fail with an error if:
- **Chart.yaml version wasn't bumped** — compare with the previous release tag
  ```bash
  git show v0.1.0:charts/showcase/Chart.yaml | grep version
  ```
- **chart-releaser encountered an issue** — check workflow logs in GitHub Actions

### Version Not Bumped Error

If you see:
```
❌ Chart.yaml version has not changed.
   Current version: 0.4.0
   Previous version (in v0.1.0): 0.4.0
   chart-releaser will skip this chart (skips existing versions).
```

**Solution:**
1. Update `Chart.yaml` to a new version (e.g., `0.4.1` → `0.5.0`)
2. Commit with: `git commit -am "chore(release): bump Chart.yaml to v0.5.0"`
3. Create a new GitHub Release with a new tag (delete the failed tag first if needed)

## Rollback

If a release needs to be rolled back:

1. Delete the tag locally and remotely:
   ```bash
   git tag -d v0.2.0
   git push origin :refs/tags/v0.2.0
   ```

2. Delete the GitHub Release on GitHub UI

3. Fix the issue and create a new release

## CI/CD Workflows

- **`build_packages.yml`**: Triggers on release publish
  - Runs optional Cypress E2E tests
  - Builds and pushes Docker images to GHCR

- **`helm-release-showcase.yaml`**: Triggers on release publish
  - Validates Chart.yaml version is new
  - Publishes chart to GitHub Pages via `chart-releaser`

## See Also

- [Chart.yaml](charts/showcase/Chart.yaml) — Helm chart metadata
- [package.json](package.json) — Application version
- [GitHub Releases](https://github.com/bcgov/BC-Wallet-Demo/releases) — Release history
- [GitHub Container Registry](https://github.com/bcgov/bc-wallet-demo/pkgs/container) — Docker images
- [Helm Chart Repository](https://bcgov.github.io/BC-Wallet-Demo) — Published charts
