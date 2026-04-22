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

### Option 3 - Docker Compose (Dev Profile)

The `dev` Docker Compose profile starts the full local stack — including the application, MongoDB, Keycloak, and its backing PostgreSQL database — with a single command:

```sh
docker compose --profile dev up
```

This brings up the following services:

| Service       | Description                                    | Default URL / Port                                      |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `dev`         | Frontend + backend in development mode (watch) | http://localhost:3000 (UI), http://localhost:5000 (API) |
| `mongodb`     | Application database                           | `127.0.0.1:27017`                                       |
| `keycloak`    | Keycloak 26.5 identity provider                | http://localhost:8080/                                  |
| `keycloak-db` | PostgreSQL backing store for Keycloak          | (internal only)                                         |

#### Keycloak

Keycloak runs in development mode (`start-dev`) with an HTTP-relative path of `/`. On first boot it imports the realm configuration from `keycloak/config/showcase-realm.json` automatically.

- **Admin console**: http://localhost:8080/admin — credentials `admin` / `admin`
- **Realm**: `showcase`
- **Client**: `showcase-admin` (public, PKCE S256 enforced)
- **Default test user**: username `admin`, password `admin` (member of the `admin` realm role)

The `frontend/public/config.json` file controls which Keycloak instance the frontend connects to at runtime:

```json
{
  "keycloakUrl": "http://localhost:8080",
  "keycloakRealm": "showcase",
  "keycloakClientId": "showcase-admin"
}
```

Update this file if you are pointing at a different Keycloak instance (e.g. a shared dev or staging server).

To also open the optional MongoDB UI, add the `mongo-ui` profile:

```sh
docker compose --profile dev --profile mongo-ui up
```

---

## Admin Portal

The admin portal is available at `<base_route>/admin` (e.g. `http://localhost:3000/digital-trust/showcase/admin`). It is protected by Keycloak OIDC authentication.

### Keycloak Setup

1. Create a realm in your Keycloak instance (e.g. `showcase`).
2. Create a client within that realm with the following settings:
   - **Client ID**: your chosen client ID (e.g. `showcase-admin`)
   - **Client authentication**: Off (public client)
   - **Standard flow**: Enabled
   - **Valid redirect URIs**: `http://localhost:3000/*` (adjust origin for production)
   - **Web origins**: `*` (or restrict to your app's origin)
3. Create at least one user in the realm and assign them a password.

### Environment Variables

The following variables are configured in `frontend/public/config.json` for runtime configuration of the Keycloak connection. If you are using Docker, you can also pass these as build arguments to set them at build time (see the Docker section above).:

| Variable Name      | Description                                      | Example Value           |
| ------------------ | ------------------------------------------------ | ----------------------- |
| `keycloakUrl`      | The base URL of your Keycloak instance           | `http://localhost:8080` |
| `keycloakRealm`    | The name of the Keycloak realm you created       | `showcase`              |
| `keycloakClientId` | The client ID of the Keycloak client you created | `showcase-admin`        |

The OIDC redirect URI is built automatically from the app's origin:

```
<window.location.origin><REACT_APP_BASE_ROUTE>/admin/callback
```

For a default local setup this resolves to:

```
http://localhost:3000/digital-trust/showcase/admin/callback
```

This URI must be listed under **Valid redirect URIs** in your Keycloak client settings.

## Contributing

Pull requests and issues are welcome.

Before submitting a change, run `yarn lint` (use `yarn lint --fix` where appropriate) and keep formatting consistent with the project’s Prettier setup.
