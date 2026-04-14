# Showcase Helm chart

Umbrella chart for the BC Wallet Demo **showcase** stack: **API server**, **web (Caddy)**, and optional **MongoDB**.

Dependencies follow [OWF `charts/acapy`](https://github.com/openwallet-foundation/helm-charts/tree/main/charts/acapy): **MongoDB** is installed from **CloudPirates** OCI (`oci://registry-1.docker.io/cloudpirates/mongodb`), not Bitnami. This chart does not use Bitnami subcharts; labels and image strings are templated locally.

## Prerequisites

- Helm 3.9+
- `.gitignore` ignores `*.tgz`; after clone run:

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

Set `showcase.server.secretEnv` for Traction and other server keys (see `server/.env.example`). Use `mongodb.enabled=false` for an external MongoDB and supply `MONGODB_URI` via `showcase.server.secretEnv` if needed.
