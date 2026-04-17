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

Requires Docker (BuildKit recommended). From the repository root:

Build the frontend (Caddy serves the static showcase). For a production-like bundle, pass Create React App variables at **build** time:

```bash
docker build -f frontend/Dockerfile \
  --build-arg REACT_APP_INSIGHTS_PROJECT_ID="your-project-id" \
  --build-arg REACT_APP_HOST_BACKEND="https://your-api-base" \
  -t bc-wallet-demo-web:local .
```

Build the server:

```bash
docker build -f server/Dockerfile -t bc-wallet-demo-server:local .
```

Run the server (example):

```bash
docker run --name bc-wallet-demo-server -p 5000:5000 --rm --env-file server/.env bc-wallet-demo-server:local
```

Run the frontend (mount a `Caddyfile` if you need custom routing; see `frontend/Caddyfile` in this repo):

```bash
docker run --name bc-wallet-demo-web -p 3000:3000 \
  -v "$(pwd)/frontend/Caddyfile:/etc/caddy/Caddyfile:ro" --rm \
  --env-file frontend/.env bc-wallet-demo-web:local
```

The app is then available at http://localhost:3000 (with defaults from your Caddyfile and env).

For **CI workflows, GHCR image names, and the `setup-node` composite action**, see [.github/README.md](.github/README.md).

## Contributing

Pull requests and issues are welcome.

Before submitting a change, run `yarn lint` (use `yarn lint --fix` where appropriate) and keep formatting consistent with the project’s Prettier setup.
