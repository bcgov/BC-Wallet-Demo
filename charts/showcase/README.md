# Showcase Helm chart

Helm chart for the BC Wallet Demo **showcase**: **frontend** (Caddy + static SPA), **server** (Express API + Socket.IO), and **MongoDB** (CloudPirates subchart, on by default).

- **MongoDB** is pulled from **CloudPirates** OCI (`oci://registry-1.docker.io/cloudpirates/mongodb`), not Bitnami. Set **`mongodb.enabled: false`** if you use an external database only.
- This chart does **not** deploy ACA-Py.

## Prerequisites

- Helm 3.9+
- From repo root, fetch subchart artifacts (ignored by git as `*.tgz`):

```bash
cd charts/showcase
helm dependency update
```

## Install

### OpenShift / BC Gov Silver (recommended overlay)

Use **`deploy/showcase/values-dev.yaml`** for the shared **dev** overlay (ingress, route timeouts, optional auto-secrets, NetworkPolicy, public dev URL). Copy or override for other namespaces or hostnames.

```bash
cd charts/showcase
helm dependency update
helm upgrade --install my-showcase . \
  -f ../../deploy/showcase/values-dev.yaml \
  --namespace <namespace> \
  --create-namespace
```

Set **`showcase.publicOrigin`** to the browser origin (HTTPS, no path). If **`ingress.enabled`** and **`ingress.frontend.hostname`** are empty, the Ingress host is taken from that URL.

### Generic cluster (minimal example)

```bash
helm upgrade --install my-showcase . \
  --namespace bc-wallet-demo --create-namespace \
  --set showcase.server.existingSecret=bc-wallet-server-env \
  --set showcase.publicOrigin='https://showcase.example.com'
```

Create the referenced **`Secret`** first (keys as env names; see **`server/.env.example`** in the app repo).

Default images: **`ghcr.io/bcgov/bc-wallet-showcase-server:main`**, **`ghcr.io/bcgov/bc-wallet-showcase-frontend:main`**. Override **`showcase.server.image`** / **`showcase.frontend.image`** if needed.

## Applying chart changes

**`helm upgrade --install`** applies ConfigMaps, NetworkPolicies, Deployment `command`/`args`, and so on. **`kubectl`/`oc rollout restart` alone** only recreates pods from the manifests already on the cluster; it does **not** pick up edits from your Git checkout until you upgrade the release.

## One hostname (UI + API)

**`showcase.publicOrigin`** is the value passed to **`VITE_HOST_BACKEND`** (scheme + host + optional port, **no path**). With ingress enabled, the usual pattern is one public host: browser → Ingress → Caddy → static files and **`reverse_proxy`** to the API.

**`showcase.baseRoute`** must match **`BASE_ROUTE`** on the server (the chart sets the latter from the same value). It must also match how the **frontend image** was built (Vite `import.meta.env`); changing only Helm without rebuilding the image can desync routes (including Socket.IO paths).

## Caddy → API (in-cluster)

- The frontend Deployment sets **`SHOWCASE_API_UPSTREAM`** using **Kubernetes service-link expansion** (for example **`http://$(SHOWCASE_SERVER_SERVICE_HOST):$(SHOWCASE_SERVER_SERVICE_PORT_HTTP)`** when the API Service is **`showcase-server`** and its port is named **`http`**). The kubelet substitutes the Service **ClusterIP** and port at pod start, so Caddy does not need working pod DNS to reach the API (avoids **`dial tcp: lookup … i/o timeout`** under strict NetworkPolicy / DNS paths).
- The Caddyfile uses **`{$SHOWCASE_API_UPSTREAM}`** for **`reverse_proxy`** and still sets **`header_up Host`** to **`<api-service-name>:<port>`** (the in-cluster name the app expects), independent of the dial address.

If **`helm upgrade`** was skipped, an older release may still run a previous Caddy/Deployment template (including older **`{$…_SERVICE_HOST}`**-style upstream wiring); **`helm upgrade`** applies the current manifests.

## Networking (`showcase.networkPolicy`)

When **`showcase.networkPolicy.enabled: true`** (default in **`deploy/showcase/values-dev.yaml`** for deny-by-default namespaces):

- **Ingress** from OpenShift router namespaces to the frontend.
- **Frontend egress**: API (**`showcase.server.containerPort`**, default **5000**) to **server pods** only. **DNS** (**UDP/TCP 53**) and **HTTPS** (**TCP 443**) are allowed to any destination (no **`to`** peers): OpenShift clusters differ in how CoreDNS is reached, and strict namespace/`ipBlock` selectors can block resolution even when port **53** is open.
- **Server ingress** from the frontend only; **server egress**: Mongo (if enabled) to **Mongo pods** only (**TCP 27017**; `app.kubernetes.io/name: mongodb`, instance = release name), plus the same **DNS + HTTPS** rule as the frontend.
- **MongoDB** ingress on **27017** from the server only (see **`templates/mongodb/networkpolicy.yaml`**).

The **`wait-for-mongo-tcp`** init container uses the same host as chart-built **`MONGODB_URI`** (**`showcase.mongodb.uriHost`**: Service **ClusterIP** when **`helm install/upgrade`** can **`lookup`** the Service, otherwise the Mongo Service FQDN). That avoids relying on pod DNS for the TCP readiness probe under NetworkPolicy.

**`showcase.networkPolicy.openshiftIngressNamespace`** defaults to **`openshift-ingress`**; override if your cluster uses a different router namespace label.

## Secrets

Prefer a pre-created **`Secret`** and **`showcase.server.existingSecret`**: the server uses **`envFrom`**, so every key becomes an env var (**`MONGODB_URI`**, **`TRACTION_URL`**, **`API_KEY`**, … — see **`server/.env.example`**).

With **`mongodb.enabled: true`**, the chart creates/reuses **`{{ release }}-showcase-mongo-root`** and builds chart-managed **`MONGODB_URI`** from that password (Helm **`lookup`**). Keep **`mongodb.auth.existingSecret`** set to the tpl string in **`deploy/showcase/values-dev.yaml`** so the Mongo subchart and server URI use the same secret source. Use **`showcase.server.existingSecret`** when you want to supply your own full server env (including `MONGODB_URI`).

### Mongo subchart

All **`mongodb:`** keys pass through to CloudPirates. Inspect the packaged chart or:

`helm show values oci://registry-1.docker.io/cloudpirates/mongodb --version 0.15.0`

## Caddy: CSP and **`trusted_proxies`**

- **`showcase.frontend.contentSecurityPolicy`** — default is permissive for the bundled React build; tighten **`connect-src`** / **`script-src`** for hardened environments.
- **`showcase.frontend.trustedProxies`** — default **`private_ranges`** (trust RFC1918 / loopback for **`X-Forwarded-*`** on **`reverse_proxy`**). **`deploy/showcase/values-dev.yaml`** sets **`0.0.0.0/0`** to mirror the bcgov demo web Caddyfile when the edge forwards from public addresses; only use that when you understand the trade-off.

## Upgrading from chart **0.2.x**

**`showcase.web`** / **`ingress.web`** became **`showcase.frontend`** / **`ingress.frontend`**. Resource names use **`-frontend`** instead of **`-web`**. Plan as a breaking values + object rename.

## Troubleshooting: 503 vs 502 (OpenShift)

- **`503`** on the **public Route**: the router did not get a **successful, timely** response from the backend (readiness, no endpoints, timeout, reset). Check **`oc describe route`**, **`oc get endpoints`**, pod **readiness**, and **router** logs—not only Caddy.
- **`502`** with **`Server: Caddy`**: **`reverse_proxy`** to the API failed (connect, timeout, **DNS lookup of the upstream hostname**, or NetworkPolicy). Check **frontend** logs for messages like **`lookup <api-service-name>: i/o timeout`** — that means the proxy could not resolve the upstream (this chart uses **service-link env expansion** in **`SHOWCASE_API_UPSTREAM`** so Caddy dials **ClusterIP** instead). From the **frontend** pod, **`wget http://127.0.0.1:3000/<baseRoute>/server/ready`** and **`wget`** to **`…/demo/socket/?EIO=4&transport=polling`** isolate Caddy vs the API path.

**`oc run … curl …` to the frontend Service from inside the same namespace** can hang: the chart NetworkPolicy typically allows **ingress :3000** only from **OpenShift router** namespaces, not from arbitrary pods. Use **`oc exec`** into the **frontend** pod, **`oc port-forward`** to **3000**, or **`curl`** from your laptop to the **public HTTPS** URL.

Quick **public** checks (replace host with yours): **`curl -i`** to **`…/server/ready`**, **`…/demo/socket/?EIO=4&transport=polling`**, and a **WebSocket upgrade** (`Connection: Upgrade`, `Upgrade: websocket`) on **`…/demo/socket/?EIO=4&transport=websocket`**—expect **200** / Engine.IO **`0{`** and **`101 Switching Protocols`** respectively when the path is healthy.

## CI

PRs touching **`charts/showcase/**`** or **`deploy/showcase/**`** run **`helm dependency update`**, **`helm lint`** (default values, **`deploy/showcase/values-dev.yaml`**, and **`deploy/showcase/values-pr.yaml`**), and **`helm template`** (see **`.github/workflows/helm-lint-showcase.yaml`**). Merges to **`main`** can run **`Deploy showcase (dev)`** when repository variables and a token secret are configured (see **`.github/workflows/deploy-showcase-dev.yaml`**).

**PR environments** (bcgov repo only): **`.github/workflows/deploy-showcase-pr.yaml`** builds and pushes **`ghcr.io/bcgov/bc-wallet-showcase-{server,frontend}:pr-<N>`**, then **`helm upgrade --install pr-<N>-showcase`** with **`deploy/showcase/values-pr.yaml`**. Requires repository variable **`SHOWCASE_PR_HOST_SUFFIX`** (hostname only, e.g. `bc-wallet-showcase-dev.apps.silver.devops.gov.bc.ca`) and OpenShift secrets **`OPENSHIFT_SERVER`**, **`OPENSHIFT_TOKEN`**, **`OPENSHIFT_DEV_NAMESPACE`**. **`.github/workflows/undeploy-showcase-pr.yaml`** runs on PR close to **`helm uninstall`** and delete labeled **`Secret`**/**`PVC`**.
