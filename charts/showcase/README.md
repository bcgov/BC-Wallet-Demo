# Showcase Helm chart

Umbrella chart for the BC Wallet Demo **showcase** stack: **API server**, **web (Caddy)**, and optional **MongoDB** (Bitnami subchart).

Layout mirrors [openwallet-foundation/helm-charts `charts/acapy`](https://github.com/openwallet-foundation/helm-charts/tree/main/charts/acapy): Bitnami **common** helpers and a conditional database chart.

## Prerequisites

- Helm 3.9+
- This repo’s `.gitignore` ignores `*.tgz`; run dependency refresh after clone:

```bash
cd charts/showcase
helm dependency update
```

## Install (example)

```bash
helm upgrade --install my-showcase . \
  --namespace bc-wallet-demo --create-namespace \
  --set mongodb.auth.rootPassword='choose-a-strong-password' \
  --set showcase.publicBackendUrl='https://api.example.com' \
  --set showcase.server.image.repository=your-registry/bc-wallet-demo-server \
  --set showcase.server.image.tag=1.0.0 \
  --set showcase.web.image.repository=your-registry/bc-wallet-demo-web \
  --set showcase.web.image.tag=1.0.0
```

Set `showcase.server.secretEnv` for Traction and other server keys (see `server/.env.example` in the repo). Disable bundled MongoDB with `mongodb.enabled=false` if you use an external database.
