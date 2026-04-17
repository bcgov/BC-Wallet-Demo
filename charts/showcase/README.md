# Showcase Helm chart

Umbrella chart for the BC Wallet Demo **showcase** stack: **API server**, **web (Caddy)**, and optional **MongoDB**.

**MongoDB** (optional) is a **CloudPirates** OCI subchart (`oci://registry-1.docker.io/cloudpirates/mongodb`), not Bitnami—similar to how other charts pull data stores from the same registry (for example [OWF `acapy`](https://github.com/openwallet-foundation/helm-charts/tree/main/charts/acapy) uses CloudPirates for Postgres). This umbrella chart does **not** deploy ACA-Py. Labels and image strings are templated locally (`templates/_helpers.tpl`).

## Prerequisites

- Helm 3.9+
- `.gitignore` ignores `*.tgz`; after clone run:

```bash
cd charts/showcase
helm dependency update
```

## Secrets (recommended: pre-provisioned Secret)

Do **not** put credentials in `values.yaml` or `--set`. Create a Kubernetes `Secret` in the target namespace (manually, [External Secrets](https://external-secrets.io/), SealedSecrets, vault agent, etc.), then set **`showcase.server.existingSecret`** to that object’s name. The server container uses **`envFrom.secretRef`**, so every key in the Secret becomes an environment variable (`MONGODB_URI`, `TRACTION_URL`, `TENANT_ID`, `API_KEY`, `WEBHOOK_SECRET`, … — see repo `server/.env.example`).

When **`mongodb.enabled`** is true and you use **`showcase.server.existingSecret`**, put a correct **`MONGODB_URI`** in that Secret (e.g. pointing at the in-cluster `{{ release }}-mongodb` service). You can also wire MongoDB’s own password via the CloudPirates subchart using **`mongodb.auth.existingSecret`** / **`mongodb.auth.existingSecretPasswordKey`** (see upstream chart values).

### Dev-only: chart-managed Secret

If **`showcase.server.existingSecret`** is empty, the chart may create **`{{ release }}-showcase-server-env`** when you set **`mongodb.auth.rootPassword`** and/or **`showcase.server.secretEnv`**. That path is intended for local testing, not production.

## Install (example)

```bash
helm upgrade --install my-showcase . \
  --namespace bc-wallet-demo --create-namespace \
  --set mongodb.enabled=true \
  --set showcase.server.existingSecret=bc-wallet-server-env \
  --set showcase.publicBackendUrl='https://api.example.com' \
  --set showcase.server.image.tag=main \
  --set showcase.web.image.tag=main
```

Default images point at [bcgov GitHub Packages](https://github.com/orgs/bcgov/packages?repo_name=BC-Wallet-Demo) (`ghcr.io/bcgov/bc-wallet-demo-server` and `ghcr.io/bcgov/bc-wallet-demo-web`). Override `registry` / `repository` / `tag` if you publish elsewhere.

Create `bc-wallet-server-env` in that namespace before upgrading (keys as env names, values as strings).

## Caddy: CSP and `trusted_proxies`

- **`showcase.web.contentSecurityPolicy`** — Default policy is **permissive** (`default-src *`, `'unsafe-inline'`, `'unsafe-eval'`) so the bundled React build and dev-style tooling behave predictably. For hardened deployments, set a stricter policy once you have enumerated `connect-src`, `script-src`, WebSocket endpoints, and any CDNs.
- **`showcase.web.trustedProxies`** — Defaults to **`private_ranges`** (Caddy: trust RFC1918 / loopback clients when interpreting forwarded headers on `reverse_proxy`). This replaces trusting **`0.0.0.0/0`**, which would treat every client as a trusted proxy. If your platform terminates TLS or forwards from unusual **public** source addresses, adjust deliberately.

## CI

Pull requests that touch `charts/showcase/**` run **Helm dependency update**, **`helm lint`**, and a **`helm template`** smoke render (see `.github/workflows/helm-lint-showcase.yaml`).
