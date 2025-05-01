# DevOps Documentation for BC Wallet Demo Project

This document outlines the DevOps practices for the **BC Wallet Demo Project**, covering the CI/CD pipelines managed by GitHub Actions and the Helm chart used for Kubernetes deployments.

---

**Table of Contents**

1.  [CI/CD Pipelines (GitHub Actions)](#cicd-pipelines-github-actions)
    *   [Overview](#overview)
    *   [Workflow Triggers and Actions](#workflow-triggers-and-actions)
        *   [Pull Request Opened/Updated (`on_pr_opened.yaml`)](#pull-request-openedupdated-on_pr_openedyaml)
        *   [Pull Request Closed (`on_pr_closed.yaml`)](#pull-request-closed-on_pr_closedyaml)
        *   [Push to `main` Branch (`on_push_main.yaml`)](#push-to-main-branch-on_push_mainyaml)
    *   [Ephemeral PR Environments](#ephemeral-pr-environments)
    *   [Docker Image Tagging](#docker-image-tagging)
    *   [Security Scanning](#security-scanning)
2.  [Helm Chart (`charts/bc-wallet`)](#helm-chart-chartsbc-wallet)
    *   [Introduction to Helm](#introduction-to-helm)
    *   [Chart Structure](#chart-structure)
    *   [Prerequisites](#prerequisites)
    *   [Configuration](#configuration)
        *   [Key Configuration Values](#key-configuration-values)
        *   [Environment Variables & Secrets](#environment-variables--secrets)
    *   [Installation](#installation)
    *   [Uninstallation](#uninstallation)
    *   [Troubleshooting](#troubleshooting)

---

## 1. CI/CD Pipelines (GitHub Actions)

### Overview

The project utilizes GitHub Actions for Continuous Integration (CI) and Continuous Deployment (CD). Workflows are defined in the `.github/workflows/` directory and trigger automatically based on Git events like pull requests and pushes to the `main` branch.

### Workflow Triggers and Actions

#### Pull Request Opened/Updated (`on_pr_opened.yaml`)

*   **Trigger:** When a Pull Request targeting the `main` branch is opened, synchronized, reopened, or marked as ready for review (and not a draft).
*   **CI Actions:**
    *   Checks if the PR is ready for review and originates from the `bcgov` organization.
    *   Runs automated tests (`/.github/actions/test`).
    *   Builds Docker images for all application components (`api-server`, `traction-adapter`, `showcase-creator`, `demo-server`, `demo-web`) using `/.github/actions/build_docker`. Images are tagged with `pr-<PR_NUMBER>-<GIT_SHA>` and pushed to GitHub Container Registry (GHCR).
    *   Scans the built Docker images for vulnerabilities using Trivy (`/.github/actions/trivy-scan`).
*   **CD Actions:**
    *   Logs into the OpenShift development environment.
    *   Deploys the application suite using the `bc-wallet` Helm chart into an ephemeral environment.
    *   Uses `helm upgrade --install` with the release name `pr-<PR_NUMBER>-bc-wallet`.
    *   Overrides image tags in the Helm deployment to use the newly built PR-specific images.
    *   Restarts the deployments to ensure the latest code is running.
    *   Posts a comment on the PR with the URLs for the deployed ephemeral environment services.

#### Pull Request Closed (`on_pr_closed.yaml`)

*   **Trigger:** When a Pull Request targeting the `main` branch is closed (either merged or discarded). Also includes a `workflow_dispatch` trigger for manual uninstallation.
*   **CD Actions (Cleanup):**
    *   Logs into the OpenShift development environment.
    *   Uninstalls the Helm release associated with the PR (`helm uninstall pr-<PR_NUMBER>-bc-wallet`).
    *   Deletes any remaining Kubernetes objects (Secrets, PVCs, Routes, Services, Deployments, etc.) associated with the PR's Helm release using `oc delete ... --selector "app.kubernetes.io/instance=pr-<PR_NUMBER>-bc-wallet"`.
    *   Deletes the PR-specific Docker images from GHCR using `snok/container-retention-policy`.

#### Push to `main` Branch (`on_push_main.yaml`)

*   **Trigger:** When code is pushed or merged to the `main` branch. Also includes a `workflow_dispatch` trigger.
*   **CI Actions:**
    *   Builds Docker images for all application components. Images are tagged with the Git SHA (`<GIT_SHA>`) and pushed to GHCR.
    *   Scans the built Docker images for vulnerabilities using Trivy.
*   **CD Actions:**
    *   **Deploy to Development:**
        *   Logs into the OpenShift development environment.
        *   Updates Helm dependencies (`helm dependency update`).
        *   Deploys/upgrades the `bc-wallet` release using `helm upgrade --install bc-wallet`.
        *   Overrides image tags to use the latest SHA-tagged images.
        *   Injects secrets required for the development environment via `--set` flags, pulling values from GitHub Actions secrets (`secrets.AUTH_SECRET`, `secrets.RABBITMQ_PASSWORD`, etc.).
        *   Restarts deployments.
    *   **Deploy to UAT (User Acceptance Testing):**
        *   Triggered after successful development deployment.
        *   Logs into the OpenShift UAT environment.
        *   Deploys/upgrades the `bc-wallet` release similarly to development, using UAT-specific secrets and namespace (`secrets.OPENSHIFT_UAT_NAMESPACE`).
        *   Restarts deployments.
    *   **Deploy to Production:**
        *   Triggered after successful UAT deployment.
        *   Logs into the OpenShift Production environment.
        *   Deploys/upgrades the `bc-wallet` release similarly to UAT, using Production-specific secrets and namespace (`secrets.OPENSHIFT_PROD_NAMESPACE`).
        *   Restarts deployments.

### Ephemeral PR Environments

An **ephemeral environment** is a short-lived, isolated deployment created specifically for a Pull Request. Key characteristics:

*   **Purpose:** Allows developers and testers to validate changes in a live, isolated environment without impacting permanent deployments (like Dev, UAT, Prod).
*   **Lifecycle:** Automatically created when a relevant PR is opened/updated and destroyed when the PR is closed.
*   **Isolation:** Each PR gets its own Helm release name (`pr-<PR_NUMBER>-bc-wallet`) and uses PR-specific Docker images, ensuring separation from other PRs and permanent environments.
*   **Configuration:** Deployed using the standard Helm chart but with image tags overridden and potentially using PR-specific configurations if defined (though currently, it primarily uses `values.yaml` with image overrides).

### Docker Image Tagging

*   **Pull Requests:** Images built during PR workflows are tagged with `pr-<PR_NUMBER>-<GIT_SHA>` (e.g., `pr-123-a1b2c3d4`).
*   **Main Branch:** Images built from the `main` branch are tagged with the Git commit SHA (e.g., `a1b2c3d4`). These tags represent stable builds deployed to permanent environments.

### Security Scanning

Docker images built in both PR and `main` branch workflows are scanned for known vulnerabilities using **Trivy**. The scan results are processed by the `/.github/actions/trivy-scan` action. While scanning occurs, the current workflows do not appear to enforce failure based on scan results but provide visibility.

---

## 2. Helm Chart (`charts/bc-wallet`)

### Introduction to Helm

[Helm](https://helm.sh/) is a package manager for Kubernetes. It helps manage Kubernetes applications through Helm Charts, which package configuration files and templates into a single, deployable unit. This project uses a Helm chart located in `charts/bc-wallet` to define, install, and upgrade the entire BC Wallet application suite and its dependencies (PostgreSQL, RabbitMQ) on Kubernetes (specifically OpenShift in this setup).

### Chart Structure

The `charts/bc-wallet` directory contains:

*   `Chart.yaml`: Metadata about the chart (name, version, etc.).
*   `values.yaml`: Default configuration values for the chart.
*   `templates/`: Directory containing Kubernetes manifest templates (Deployments, Services, Secrets, Ingress/Routes, etc.) written in Go template language. These templates are rendered with values from `values.yaml` (and `--set` overrides) during deployment.
*   `charts/`: Directory for chart dependencies (like PostgreSQL and RabbitMQ subcharts).

*(The following sections are adapted from the chart's README)*

### Prerequisites

*   Kubernetes cluster (tested on OpenShift)
*   Helm v3+ installed
*   `kubectl` or `oc` configured to interact with your cluster

### Configuration

The chart uses `values.yaml` for configuration. You can modify this file directly or create a separate `my-values.yaml` file and use it during installation (`-f my-values.yaml`).

#### Key Configuration Values

Many configuration options are available in `values.yaml`. Here are some important ones you might need to customize:

*   **`ingressSuffix`**: The base domain suffix used to generate public hostnames for the different services (e.g., `-dev.apps.silver.devops.gov.bc.ca`). The chart automatically constructs hostnames like `{{ .Release.Name }}-api-server{{ .Values.ingressSuffix }}`.
*   **`global.namespaceOverride`**: Set this if you want to deploy the chart into a specific namespace different from the one Helm targets.
*   **Log Levels**: Adjust `LOG_LEVEL` under `api_server.env`, `traction_adapter.env`, `demo_web.env`, and `demo_server.env` (e.g., `info`, `debug`, `warn`).
*   **Resource Limits/Requests**: Modify `resources` sections for each component (`api_server`, `traction_adapter`, etc.) to adjust CPU and memory allocation based on your cluster's capacity and expected load.
*   **Replica Counts**: Change `replicaCount` for components if you need more instances for high availability or load. Consider enabling `autoscaling` for components that support it.
*   **Persistence**: PostgreSQL (`postgresql.primary.persistence`) and RabbitMQ (`rabbitmq.persistence`) have persistence enabled by default. You can adjust the `size` or disable it if needed.

#### Environment Variables & Secrets

The application components rely on several environment variables. Some are configured directly in `values.yaml`, while others involve sensitive information (secrets).

**Non-Sensitive Environment Variables (Configure in `values.yaml` or custom values file):**

*   `api_server.env.OIDC_REALM`: Your OIDC provider's realm name.
*   `api_server.env.OIDC_SERVER_URL`: The base URL of your OIDC provider.
*   `traction_adapter.env.TRACTION_DEFAULT_TENANT_ID`: The default Traction Tenant ID to use.
*   `traction_adapter.env.TRACTION_DEFAULT_WALLET_ID`: The default Traction Wallet ID associated with the tenant.
*   `traction_adapter.env.TRACTION_DEFAULT_API_URL`: The URL for the Traction Tenant API.
*   `showcase_creator.env.OIDC_ISSUER_URL`: The full issuer URL for OIDC (often `OIDC_SERVER_URL`/realms/`OIDC_REALM`).
*   `demo_web.env.DEMOWEB_SNOWPLOW_ENDPOINT`: Endpoint for Snowplow analytics (if used).
*   `demo_web.env.DEMOWEB_INSIGHTS_PROJECT_ID`: Project ID for analytics (if used).
*   `postgresql.auth.username`: Username for the application database user.
*   `postgresql.auth.database`: Name of the application database.
*   `rabbitmq.auth.username`: Username for RabbitMQ access.

**Sensitive Environment Variables (Set via `--set` during installation or via GitHub Secrets in CI/CD):**

These values are sensitive and should not be stored directly in version control. Use the `--set` flag during manual Helm installation/upgrade or configure them as GitHub Actions secrets for automated deployments.

*   `api_server.env.OIDC_CLIENT_ID`: The Client ID for OIDC authentication.
*   `api_server.env.OIDC_CLIENT_SECRET`: The Client Secret for OIDC authentication.
*   `traction_adapter.env.TRACTION_DEFAULT_API_KEY`: The API key for accessing the Traction Tenant API.
*   `demo_server.env.TRACTION_WEBHOOK_SECRET` (or `demo_server.env.WEBHOOK_SECRET` in `on_push_main.yaml`): A secret used to secure webhooks. *Note: Variable name consistency should be checked.*
*   `rabbitmq.auth.password`: The password for the RabbitMQ user. (If not provided during manual install, the chart will generate one).
*   `api_server.env.ENCRYPTION_KEY`: The encryption key for the API server. The Key should be 32 characters long and encoded in Base58.
*   `postgresql.auth.secretKeys`: Passwords for PostgreSQL admin and application users. (If not provided during manual install, the chart will generate them).
*   *Other secrets seen in `on_push_main.yaml`*: `AUTH_SECRET`, `AUTH_KEYCLOAK_SECRET`, `ENCRYPTION_KEY`, `FIXED_API_KEY`, `FIXED_WALLET_ID`, `FIXED_TENANT_ID`, `API_KEY`, `TENANT_ID`, `WALLET_KEY`, `REACT_APP_SNOWPLOW_ENDPOINT`. Ensure these are documented and managed securely.

**Auto-Generated / Internal Variables:**

*   **Database/RabbitMQ Connection:** Hostnames (`{{ .Release.Name }}-postgresql`, `{{ .Release.Name }}-rabbitmq`) and ports are automatically configured based on the deployed services within the chart.
*   **Service URLs:** URLs like `REACT_APP_DEMO_API_URL`, `REACT_APP_SHOWCASE_API_URL`, `NEXT_PUBLIC_WALLET_URL`, `FIXED_SHOWCASE_BACKEND`, etc., are constructed dynamically using the generated ingress hosts.

### Installation

*(Manual Installation Example)*

1.  **Customize Values:**
    *   Edit `values.yaml` or create a `my-values.yaml` file with your non-sensitive overrides (like `ingressSuffix`, OIDC URLs, Traction IDs, etc.).
    *   Prepare the sensitive values you need to set via the command line.

2.  **Install/Upgrade:**
    Use `helm upgrade --install` to deploy or update the chart. Replace `<your-release-name>` with a name for this deployment (e.g., `bc-wallet-dev`). Provide your sensitive values using `--set`.

    ```bash
    # Example for manual deployment - adapt secrets as needed
    helm upgrade --install <your-release-name> ./charts/bc-wallet -f ./charts/bc-wallet/values.yaml \
      --namespace <your-namespace> \
      --set api_server.env.OIDC_CLIENT_ID='YOUR_OIDC_CLIENT_ID' \
      --set api_server.env.OIDC_CLIENT_SECRET='YOUR_OIDC_CLIENT_SECRET' \
      --set traction_adapter.env.TRACTION_DEFAULT_API_KEY='YOUR_TRACTION_API_KEY' \
      --set demo_server.env.TRACTION_WEBHOOK_SECRET='YOUR_WEBHOOK_SECRET' \
      --set api_server.env.ENCRYPTION_KEY='YOUR_ENCRYPTION_KEY' \
      --set rabbitmq.auth.password='YOUR_RABBITMQ_PASSWORD'
      # --set postgresql.auth.existingSecret=your-existing-pg-secret # Optionally provide existing PG secret
      # Add -f my-values.yaml here if you created a custom values file
      # Add other required --set flags for secrets if not using generated ones
    ```

    *   Replace placeholder values like `YOUR_OIDC_CLIENT_ID` with your actual secrets.
    *   Specify the target `--namespace` for deployment.
    *   If you don't provide `rabbitmq.auth.password` or configure `postgresql.auth.existingSecret`, the chart will generate random passwords/keys for you and store them in Kubernetes Secrets. You can retrieve these generated secrets using `kubectl get secret <secret-name> -o jsonpath='{.data.<key>}' | base64 -d`.

*(Note: Automated deployments via GitHub Actions handle secret injection differently, using `${{ secrets.GITHUB_SECRET_NAME }}` syntax within the workflow files.)*

### Uninstallation

To remove a Helm deployment:

```bash
helm uninstall <your-release-name> --namespace <your-namespace>
```

For complete cleanup, especially after manual uninstallation or if Helm fails, you might need to manually delete associated resources:

```bash
# Example using oc for OpenShift
oc delete secret,pvc,route,service,deployment,statefulset,configmap --selector "app.kubernetes.io/instance=<your-release-name>" -n <your-namespace>
```

### Troubleshooting

If you encounter issues, check the logs of the affected pods:

```bash
# Example using oc for OpenShift
oc logs <pod-name> -n <your-namespace>
# Follow logs in real-time
oc logs -f <pod-name> -n <your-namespace>
# Check events for deployment issues
oc get events -n <your-namespace> --sort-by='.lastTimestamp'
```

Common issues might relate to incorrect secret values, resource limits being too low, or network connectivity between components.


