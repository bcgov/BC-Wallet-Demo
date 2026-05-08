[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# BC Wallet Demo

## Overview

This application provides a showcase for the BC Wallet to illustrate the use cases for verifiable credentials. This application will take users through multiple steps to demonstrate how verifiable credentials are issued and verified using the BC Wallet.

## Running

### 1. Configure environment variables

Copy the example env files and edit them to match your setup:

```bash
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env
```

The placeholder values in `.env.example` are enough to start the app locally. To issue or verify **real** credentials you need a [Traction](https://digital.gov.bc.ca/digital-trust/technical-resources/traction/) tenant — set `TENANT_ID`, `API_KEY`, `TRACTION_URL`, `TRACTION_DID`, and `WEBHOOK_SECRET` in `server/.env`. See [DEVELOPER/BC Wallet Showcase.md](DEVELOPER/BC%20Wallet%20Showcase.md) for the full Traction and ngrok webhook setup.

### 2. Start the stack

#### Docker Compose — recommended

Requires Docker. A single command starts the frontend, backend, MongoDB, Keycloak, and its database — no local Node.js toolchain needed:

```bash
docker compose --profile dev up --build
```

On first run Docker builds the dev image; subsequent starts skip the build. The bind-mount means **code changes are picked up immediately** without rebuilding.

| Service       | URL / port                                    |
| ------------- | --------------------------------------------- |
| Frontend (UI) | http://localhost:3000/digital-trust/showcase/ |
| Backend (API) | http://localhost:5000                         |
| Keycloak      | http://localhost:8080 (admin / admin)         |
| MongoDB       | 127.0.0.1:27017 (host only)                   |

To also open the optional MongoDB web UI:

```bash
docker compose --profile dev --profile mongo-ui up --build
```

#### Native (Node.js 22+ and Yarn 1.x)

MongoDB must be running separately (e.g. `docker compose up mongodb`).

```bash
yarn install
yarn dev
```

Frontend runs at http://localhost:3000 and the API at http://localhost:5000.

---

### Keycloak (included in the Docker Compose dev profile)

Keycloak runs in development mode and imports the realm from `keycloak/config/showcase-realm.json` automatically on first boot.

- **Admin console**: http://localhost:8080/admin — credentials `admin` / `admin`
- **Realm**: `showcase` | **Client**: `showcase-admin` (public, PKCE S256)
- **Default test user**: `admin` / `admin` (member of the `admin` realm role)

`frontend/public/config.json` controls which Keycloak instance the frontend connects to at runtime. Update it when pointing at a shared dev or staging server:

```json
{
  "keycloakUrl": "http://localhost:8080",
  "keycloakRealm": "showcase",
  "keycloakClientId": "showcase-admin"
}
```

### Advanced: production-like Docker builds

These are the individual image builds used by CI and the production `backend`/`frontend` Compose services. Most contributors can skip this section.

```bash
# Frontend (static Vite build served by Caddy)
docker build -f frontend/Dockerfile \
  --build-arg REACT_APP_INSIGHTS_PROJECT_ID="your-project-id" \
  --build-arg REACT_APP_HOST_BACKEND="https://your-api-base" \
  -t bc-wallet-demo-web:local .

# Backend
docker build -f server/Dockerfile -t bc-wallet-demo-server:local .

# Production-like Compose stack (no Keycloak, no hot-reload)
docker compose --profile prod up --build
```

Browse the frontend at `http://localhost:3000/digital-trust/showcase/` — the path must match `VITE_BASE_ROUTE` in `frontend/.env` and `frontend/Caddyfile`.

For **GHCR image names, release workflows, and the `setup-node` composite action**, see [.github/README.md](.github/README.md).

#### CI: Cypress on pull requests

**`.github/workflows/continuous-integration.yml`** runs Cypress with `yarn workspace frontend start` only (Vite on port 3000). `cypress.config.ts` sets `apiUrl` to `http://localhost:5000` for specs that call the API — if those run in CI, start the server too (e.g. with `concurrently`, mirroring `build_packages.yml` which runs `yarn dev` for both processes).

---

## Admin Portal

The admin portal is at `<base_route>/admin` (e.g. `http://localhost:3000/digital-trust/showcase/admin`), protected by Keycloak OIDC.

The Docker Compose dev profile ships a pre-configured Keycloak realm — no manual setup needed locally. For a **custom or production Keycloak instance**:

1. Create a realm (e.g. `showcase`).
2. Create a client with these settings:
   - **Client ID**: e.g. `showcase-admin`
   - **Client authentication**: Off (public client)
   - **Standard flow**: Enabled
   - **Valid redirect URIs**: `http://localhost:3000/*` (adjust for production)
   - **Web origins**: `*` (or restrict to your app's origin)
3. Create at least one user and assign them the `admin` realm role.

The OIDC redirect URI is built automatically:

```
<window.location.origin><VITE_BASE_ROUTE>/admin/callback
# e.g. http://localhost:3000/digital-trust/showcase/admin/callback
```

This URI must be listed under **Valid redirect URIs** in your Keycloak client settings.

### Keycloak environment variables

Configured in `frontend/public/config.json` at runtime:

| Variable           | Description                        | Example                 |
| ------------------ | ---------------------------------- | ----------------------- |
| `keycloakUrl`      | Base URL of your Keycloak instance | `http://localhost:8080` |
| `keycloakRealm`    | Realm name                         | `showcase`              |
| `keycloakClientId` | Client ID                          | `showcase-admin`        |

## Contributing

Pull requests and issues are welcome.

Before submitting a change, run `yarn lint` (use `yarn lint --fix` where appropriate) and keep formatting consistent with the project’s Prettier setup.
