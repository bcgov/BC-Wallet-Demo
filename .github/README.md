# GitHub Actions and CI

This folder defines automation for the BC Wallet Demo monorepo (`frontend` and `server` Yarn workspaces). All Node-based jobs use **Node.js 22**, matching `engines.node` in `package.json`.

## Composite action: `actions/setup-node`

**Path:** `.github/actions/setup-node/action.yml`

**Purpose:** Install Node and enable Yarn dependency caching in one step.

**Inputs:**

| Input           | Required | Description        |
|-----------------|----------|--------------------|
| `node-version`  | yes      | Node major or semver (e.g. `22`) |

**Behaviour:**

- Runs [`actions/setup-node@v4`](https://github.com/actions/setup-node) with `cache: yarn` and `cache-dependency-path: yarn.lock` (repository root). No separate `actions/cache` step and no `yarn` invocation before Node is installed.

**Usage:**

```yaml
- uses: ./.github/actions/setup-node
  with:
    node-version: 22
```

---

## Workflow: Continuous Integration

**File:** `.github/workflows/continuous-integration.yml`  
**Name:** `Continuous Integration`

**Triggers:** Pull requests targeting `main` or `release`.

**Concurrency:** One active run per PR (`cancel-in-progress: true`) so new pushes cancel older runs.

**Global env:** `HUSKY=0` so Husky does not run during `yarn install` in CI.

| Job                    | What it does |
|------------------------|--------------|
| **Server Unit Tests**  | `yarn install --frozen-lockfile`, then `yarn workspace server test` |
| **Frontend Unit Tests**| `yarn install --frozen-lockfile`, then `yarn workspace frontend test:unit` |
| **Cypress E2E Tests**  | Lint (`yarn lint`), Prettier check, `yarn check-types`, then Cypress with `yarn workspace frontend start` and `wait-on` for `http://localhost:3000` |

---

## Workflow: PR Docker smoke build

**File:** `.github/workflows/on_pr_opened.yaml`  
**Name:** `PR Docker smoke build`

**Triggers:** Non-draft pull requests to `main` when relevant paths change (see `paths:` in the workflow), on open/sync/reopen/ready for review.

**Purpose:** Ensure `server/Dockerfile` and `frontend/Dockerfile` both build with the default GitHub-hosted runner (`DOCKER_BUILDKIT=1`). This does **not** push images and does **not** pass production `REACT_APP_*` build-args; it only verifies the Docker build graph.

---

## Workflow: Build and Publish Packages

**File:** `.github/workflows/build_packages.yml`  
**Name:** `Build and Publish Packages`

**Triggers:**

- **`release`:** `published` — runs when a GitHub Release is published.
- **`workflow_dispatch`:** Manual run with optional input `run_cypress` (boolean) to run browser E2E before image builds.

**Global env:** `HUSKY=0`.

### Job graph

1. **`cypress-run`** (conditional) — On every **release** publish, or when manual dispatch sets `run_cypress: true`. Checks out the repo, uses `setup-node` (Node 22), runs `yarn install --frozen-lockfile`, starts `yarn dev` in the background, waits with `wait-on` for `http://localhost:3000` and `http://localhost:5000`, short warm-up sleep, then runs **Cypress** (`cypress-io/github-action@v6`, `install: false`, optional Dashboard recording via `CYPRESS_RECORD_KEY`).

2. **`cypress-skipped`** — Runs when Cypress is not required (manual dispatch with `run_cypress: false`). Satisfies `needs` for the image jobs without doing work.

3. **`build-and-push-image-server`** and **`build-and-push-image-frontend`** — Both `need` the Cypress jobs and only proceed if nothing failed and at least one of the Cypress paths succeeded (see `if:` in the workflow). They **do not** run `yarn install` on the runner: the only install/build for the published images happens **inside Docker**, avoiding duplicate work.

### GHCR images

Images are pushed to **GitHub Container Registry** (`ghcr.io`):

| Variable in workflow              | Image |
|-----------------------------------|--------|
| `SHOWCASE_SERVER_IMAGE`           | `ghcr.io/<owner>/bc-wallet-showcase-server` |
| `SHOWCASE_FRONTEND_IMAGE`         | `ghcr.io/<owner>/bc-wallet-showcase-frontend` |

Jobs use `docker/login-action@v3`, `docker/setup-buildx-action@v3`, `docker/metadata-action@v5`, and `docker/build-push-action@v7` with **minimal provenance** and **SBOM** attestations (`provenance: mode=min`, `sbom: true`).

### Frontend image: build-time configuration

Create React App reads **`REACT_APP_*`** at **build** time. The release workflow passes secrets into the Docker build as **build-args** (see `build-args` on the frontend `docker/build-push-action` step). The **`frontend/Dockerfile`** declares matching `ARG`/`ENV` values before `yarn workspace frontend build`.

Required repository **secrets** for a correct production frontend bundle (names must match the workflow):

- `REACT_APP_INSIGHTS_PROJECT_ID`
- `REACT_APP_HOST_BACKEND`

Optional / other secrets (e.g. Cypress) are documented in the workflow file and org settings.

### Local Docker build (frontend)

To approximate CI locally for the showcase web image:

```bash
docker build -f frontend/Dockerfile \
  --build-arg REACT_APP_INSIGHTS_PROJECT_ID="..." \
  --build-arg REACT_APP_HOST_BACKEND="..." \
  -t bc-wallet-showcase-frontend:local .
```

---

## Dependabot

**File:** `.github/dependabot.yml` — version updates for GitHub Actions, npm (root workspace), and Dockerfiles under `/`, `/frontend`, and `/server`.

---

## Related docs

- Root [README.md](../README.md) — run and Docker overview for developers.
- [DEVELOPER/BC Wallet Showcase.md](../DEVELOPER/BC%20Wallet%20Showcase.md) — Traction, env files, and OpenShift-oriented notes.
