# Helm Charts Documentation for BC Wallet Demo Project

This document outlines how Helm charts are structured and used to deploy applications in the BC Wallet Demo Project.

---

## What Is an Ephemeral PR Environment?

- A short-lived Helm **release** created per PR
- Isolated from other deployments
- Automatically created on PR open and destroyed on PR close

Each PR gets:

- Its own release name (e.g., `bc-wallet-pr-123`)
- A Docker image tagged with `github.sha`
- Custom values loaded from `values-pr.yaml`

---

## Helm Chart Structure

Chart path: `charts/bc-wallet/`

### Top-Level Files

- `Chart.yaml`: Defines chart metadata and dependencies (e.g., Bitnami PostgreSQL, RabbitMQ)
- `values.yaml`: Defines default values and environment-specific configuration
- `_helpers.tpl`: Central location for custom template functions (e.g., naming)
- `_networkpolicy_helpers.tpl`: Shared logic for dynamic network policy rendering
- `ingress.yaml`: Shared ingress configuration for routing multiple services

### Service-Specific Folders (`templates/`)

Each component has its own folder and set of Kubernetes manifests. The services currently supported are:

- `api-server/`
- `demo-server/`
- `demo-web/`
- `showcase-creator/`
- `traction-adapter/`

Each folder consistently includes the following resource templates:

- `deployment.yaml`: Defines how the app container is deployed and configured
- `service.yaml`: Exposes the app internally in the cluster via ClusterIP
- `hpa.yaml`: Adds optional Horizontal Pod Autoscaler support
- `networkpolicy.yaml`: Applies namespace- and label-based ingress/egress rules
- `serviceaccount.yaml`: Optionally creates and annotates a service account for the pod

- `deployment.yaml`: Renders a `Deployment` using `.Values.<service>.image`, `.env`, `resources`, etc.
- `service.yaml`: Configures a `ClusterIP` service using `.Values.<service>.port`
- `hpa.yaml`: Conditional rendering of HPA (based on `.autoscaling.enabled`)
- `networkpolicy.yaml`: Applies namespaced ingress/egress rules
- `serviceaccount.yaml`: Optional creation of service accounts

### Shared Templates (`common/`)

Templates that apply across services:

- `authtoken-secret.yaml`: Renders a shared Kubernetes `Secret`
- `configmap.yaml`: Global or shared environment variables
- `networkpolicy.yaml`: Global ingress control using label selectors

---

## Values File Overview (`values.yaml`)

### Global Configuration

- `nameOverride`, `fullnameOverride`: Control rendered names
- `global.namespaceOverride`: Optional override for deployment namespace
- `ingressSuffix`: Used to construct dynamic hostnames

### Ingress Configuration

- Enabled via `.ingress.enabled`
- Hosts and paths configured per service
- Injects OpenShift-specific annotations

### Per-Service Configuration

Each service (e.g., `api_server`, `demo_web`) supports:

- `image.repository`, `image.tag`, `pullPolicy`
- `replicaCount`
- `env`: Passed into container via `envFrom` or inline
- `resources`: Requests and limits
- `autoscaling`: Enabled or disabled with thresholds
- `openshift.route`: Optionally creates OpenShift `Route` resource (disabled by default)

### Dependencies

- PostgreSQL and RabbitMQ are included as optional dependencies using Bitnami Helm charts
- Enabled via `.postgresql.enabled` and `.rabbitmq.enabled`
- Parameters like `auth.username`, `database`, and `resources` are overridden in `values.yaml`

---

## Template Functions and Helpers

Helm uses `_helpers.tpl` and `_networkpolicy_helpers.tpl` to define reusable logic and naming patterns.

### `_helpers.tpl`

Defines reusable functions for:

- Chart/component naming (`name`, `fullname`, `chart`)
- Common labels and selector labels
- Secret generation (`getOrGeneratePass`)
- Database/RabbitMQ secret naming and key lookups
- OpenShift route host and TLS rendering per service

Example:

```yaml
{{ include "bc-wallet-showcase-builder.fullname" . }}
{{ include "bc-wallet-showcase-builder.demo-server.host" . }}
{{ include "bc-wallet-showcase-builder.api-server.openshift.route.tls" . }}
```

### `_networkpolicy_helpers.tpl`

Centralizes logic for intra-release communication rules between components (e.g., allow ingress from other pods in the same release).

```yaml
{{ include "bc-wallet-showcase-builder.intra-release-network-policy" (dict "Release" .Release "Values" .Values "componentName" "demo-web" "componentLabel" "frontend" "servicePort" 80) }}
```

---

```bash
helm upgrade --install bc-wallet-pr-123 ./charts/bc-wallet \
  -f values-pr.yaml \
  --set image.tag=${GITHUB_SHA}
```

- The PR-specific release uses its own image tag and value file
- All resources (deployments, services, routes) are templated and released as a unit

---

## Values File

Currently, the Helm chart uses a single `values.yaml` file at the root level to define configuration for all services and global settings. This file includes:

- Global flags such as `ingressSuffix`, `nameOverride`, and namespace overrides
- Individual service blocks for `api_server`, `traction_adapter`, `demo_web`, `showcase_creator`, and `demo_server`
- Configuration for image repositories, resource requests/limits, environment variables, autoscaling policies, and service definitions
- Ingress setup, network policies, and OpenShift-specific route configurations
- Dependencies on Bitnami PostgreSQL and RabbitMQ charts

All environments (PR, development, staging, production) rely on this single `values.yaml`, with any environment-specific overrides likely passed at runtime via the Helm CLI using `--set` or additional value injection strategies.

\---------------|---------------------| | PR            | `values-pr.yaml`    | | Development   | `values-dev.yaml`   | | Staging       | `values-staging.yaml` | | Production    | `values-prod.yaml`  |

---

## Directory Structure

```
charts/
  └─ bc-wallet/
     ├─ Chart.yaml
     ├─ values.yaml
     ├─ _helpers.tpl
     ├─ _networkpolicy_helpers.tpl
     ├─ ingress.yaml
     ├─ templates/
     │   ├─ api-server/
     │   │   ├─ deployment.yaml
     │   │   ├─ hpa.yaml
     │   │   ├─ networkpolicy.yaml
     │   │   ├─ service.yaml
     │   │   └─ serviceaccount.yaml
     │   ├─ demo-server/
     │   │   ├─ deployment.yaml
     │   │   ├─ hpa.yaml
     │   │   ├─ networkpolicy.yaml
     │   │   ├─ service.yaml
     │   │   └─ serviceaccount.yaml
     │   ├─ demo-web/
     │   │   ├─ deployment.yaml
     │   │   ├─ hpa.yaml
     │   │   ├─ networkpolicy.yaml
     │   │   ├─ service.yaml
     │   │   └─ serviceaccount.yaml
     │   ├─ showcase-creator/
     │   │   ├─ deployment.yaml
     │   │   ├─ hpa.yaml
     │   │   ├─ networkpolicy.yaml
     │   │   ├─ service.yaml
     │   │   └─ serviceaccount.yaml
     │   ├─ traction-adapter/
     │   │   ├─ deployment.yaml
     │   │   ├─ hpa.yaml
     │   │   ├─ networkpolicy.yaml
     │   │   ├─ service.yaml
     │   │   └─ serviceaccount.yaml
     │   ├─ common/
     │   │   ├─ authtoken-secret.yaml
     │   │   ├─ configmap.yaml
     │   │   └─ networkpolicy.yaml
     └─ charts/
         ├─ postgresql-12.5.7.tgz
         └─ rabbitmq-11.16.0.tgz
```

---

This Helm structure ensures that each service can be independently configured and deployed while reusing shared definitions across environments. It supports secure networking, flexible routing, and isolated deployments for PR previews or full releases.

