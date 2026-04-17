[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# BC Wallet Demo

## Overview

This application provides a showcase for the BC Wallet to illustrate the use cases for verifiable credentials. This application will take users through multiple steps to demonstrate how verifiable credentials are issued and verified using the BC Wallet.

## Running

### Copy env files

Copy the files server/.env.example and client/.env.example to server/.env and client/.env  
Edit the .env files to match your project needs

### Option 1 - Native

Please make sure you have a recent version of node, npm, and yarn installed
These steps are executed from the root folder of the project:

> yarn install

> yarn dev

The application will now be running at http://localhost:3000

### Option 2 - Docker

These steps assume that you have docker installed

These steps are executed from the root folder of the project:

Build the client:

> docker build -t bc-wallet-demo-client . -f DockerfileClient

Build the server:

> docker build -t bc-wallet-demo-server . -f DockerfileServer

Start the server:

> docker run --name bc-wallet-demo-server -p5000:5000 --rm --env-file server/.env bc-wallet-demo-server

Start the client:

> docker run --name bc-wallet-demo-client -p3000:3000 -v \`pwd\`/Caddyfile:/etc/caddy/Caddyfile --rm --env-file client/.env bc-wallet-demo-client

The application will now be running at http://localhost:3000

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

The following variables are configured in `frontend/.env`:

| Variable                       | Description                      | Default                 |
| ------------------------------ | -------------------------------- | ----------------------- |
| `REACT_APP_KEYCLOAK_URL`       | Base URL of your Keycloak server | `http://localhost:8080` |
| `REACT_APP_KEYCLOAK_REALM`     | Keycloak realm name              | `showcase`              |
| `REACT_APP_KEYCLOAK_CLIENT_ID` | Keycloak client ID               | `showcase-admin`        |

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

**Pull requests are always welcome!**

Please see the [Contributions Guide](CONTRIBUTING.md) for the repo.

Before contributing please run `yarn lint --fix` and fix any linter warnings in your code contribution.

You may also create an issue if you would like to suggest additional resources to include in this repository.

All contrbutions to this repository should adhere to our [Code of Conduct](./CODE_OF_CONDUCT).
