[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# BC Wallet Demo

## Overview

This application provides a showcase for the BC Wallet to illustrate the use cases for verifiable credentials. This application will take users through multiple steps to demonstrate how verifiable credentials are issued and verified using the BC Wallet.

## Running

### Copy env files

Copy `server/.env.example` → `server/.env` and `frontend/.env.example` → `frontend/.env`.  
Edit the `.env` files to match your project needs (see [DEVELOPER/BC Wallet Showcase.md](DEVELOPER/BC%20Wallet%20Showcase.md) for Traction and webhook setup).

### Option 1 - Native

Use **Node.js 22 or newer** (see `engines` in `package.json`), plus Yarn 1.x.  
From the repository root:

> yarn install

> yarn dev

The application will now be running at http://localhost:3000

### Option 2 - Docker

Requires Docker (BuildKit recommended). From the repository root.

#### Build static frontend image

The showcase frontend is a **Vite** production build, served by **Caddy**. Pass **`REACT_APP_*` build-args** at **image build** time (CI and older scripts still use those names); **`frontend/Dockerfile`** maps them to **`VITE_*`** for `vite build`.

```bash
docker build -f frontend/Dockerfile \
  --build-arg REACT_APP_INSIGHTS_PROJECT_ID="your-project-id" \
  --build-arg REACT_APP_HOST_BACKEND="https://your-api-base" \
  -t bc-wallet-demo-web:local .
```

#### Build server image

```bash
docker build -f server/Dockerfile -t bc-wallet-demo-server:local .
```

#### Run containers (examples)

Server:

```bash
docker run --name bc-wallet-demo-server -p 5000:5000 --rm --env-file server/.env bc-wallet-demo-server:local
```

Frontend (mount `frontend/Caddyfile` when you need the repo routing; see that file for `VITE_BASE_ROUTE`):

```bash
docker run --name bc-wallet-demo-web -p 3000:3000 \
  -v "$(pwd)/frontend/Caddyfile:/etc/caddy/Caddyfile:ro" --rm \
  --env-file frontend/.env bc-wallet-demo-web:local
```

With the default production **`base`** in Vite, browse **`http://localhost:3000/digital-trust/showcase/`** (must match **`VITE_BASE_ROUTE`** in `frontend/.env` and your Caddyfile).

#### Docker Compose

`docker-compose.yml` includes **MongoDB**, optional **mongo-express** (profile **`mongo-ui`**), a **`backend` + `frontend`** pair (built images), and a **`dev`** service (repo bind-mounted, runs `yarn dev`). **`dev` and the `frontend`/`backend` pair both bind ports 3000 and 5000**, so do **not** run `docker compose up` with every service at once.

Typical commands:

- **Production-like stack:** `docker compose up --build mongodb backend frontend`
- **Single dev container + Mongo:** `docker compose up --build mongodb dev`
- **Mongo Express UI:** add **`--profile mongo-ui`** and include **`mongo-express`** (see the comment at the top of `docker-compose.yml`).

#### CI: Cypress on pull requests

**`.github/workflows/continuous-integration.yml`** runs Cypress with **`yarn workspace frontend start`** only (Vite on port 3000). `cypress.config.ts` still sets **`apiUrl`** to **`http://localhost:5000`** for specs that call the API—if those paths run in CI, start the server as well (for example with **`concurrently`**, or mirror **`build_packages.yml`**, which starts **`yarn dev`** for both processes).

For **GHCR image names, release workflows, and the `setup-node` composite action**, see [.github/README.md](.github/README.md).

## Contributing

Pull requests and issues are welcome.

Before submitting a change, run `yarn lint` (use `yarn lint --fix` where appropriate) and keep formatting consistent with the project’s Prettier setup.
