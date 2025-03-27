# DevOps Documentation for BC Wallet Demo Project

This document outlines the complete DevOps pipeline for the **BC Wallet Demo Project**, including CI/CD automation, ephemeral PR environments, Docker image builds, Helm-based deployments, and security scanning using Trivy. The pipeline is defined via GitHub Actions.

---

## Step-by-Step CI/CD Pipeline Flow

The DevOps workflow is implemented using **GitHub Actions**, and kicks in automatically based on Git events such as PR creation, PR closure, or merging to `main`. Below is the chronological sequence of how the pipeline executes:

### CI vs CD: When Do They Happen?

- **CI (Continuous Integration)** kicks in when a **Pull Request is opened or updated**. It includes testing, security scanning, building Docker images, and pushing them to a container registry.
- **CD (Continuous Deployment)** happens when the **CI passes successfully**, deploying those images into isolated ephemeral environments. A separate CD also occurs when code is **merged to the **main** branch**, deploying to permanent environments like development or staging.

### What Is an Ephemeral PR Environment?

An **ephemeral environment** is a short-lived, isolated Helm release created for each PR. It:

- Allows developers/testers to validate changes live without impacting others.
- Is automatically created when a PR is opened.
- Is destroyed as soon as the PR is closed.

Each PR gets:

- Its **own Helm release name** to ensure isolation from other deployments.
- Uses generic Docker images **tagged with the Git SHA**.
- Helm deploys the release using `values-pr.yaml`, along with secrets, pods, services, and other Kubernetes resources.

---

### Step 1: Developer Opens a Pull Request (PR)

- **Workflow Triggered:** `on_pr_opened.yaml`
- **Action:**
  - Begins CI pipeline execution.
  - Starts QA, build, scan, and push stages (see Step 2).

### Step 2: Continuous Integration (CI)

This is defined in the `cicd.yaml` workflow. Each PR triggers the following phases:

#### 2.1 QA Phase

- Runs unit tests.
- (Optional) Static code analysis via SonarQube (planned).

#### 2.2 Build Phase

- Docker images are built using app-specific Dockerfiles located under `apps/<appname>/Dockerfile`.
- The old `docker/` folder is deprecated and should be removed if unused.

#### 2.3 Security Scan Phase

- Images are scanned using [Trivy](https://github.com/aquasecurity/trivy) to identify vulnerabilities.
- This happens before pushing the image.

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/org/project/service:${{ github.sha }}
```

#### 2.4 Push Phase

- If all prior stages pass, the image is pushed to GHCR using a **Git SHA tag**.

```yaml
- name: Push to GHCR
  run: docker push ghcr.io/org/project/service:${{ github.sha }}
```

---

### Step 3: Ephemeral PR Environment Deployment

- **Triggered by:** continuation of `on_pr_opened.yaml`
- **How it works:**
  - Helm uses the image tagged with `${{ github.sha }}` and deploys a new Helm release named uniquely per PR.
  - The Kubernetes namespace is provided by the OpenShift runtime; no explicit `--namespace` is defined in the Helm command.
  - Helm deploys application components (pods, secrets, services, deployments, etc.) using `charts/wallet` and `values-pr.yaml`.

```bash
helm upgrade --install bc-wallet-pr-123 ./charts/wallet \
  -f values-pr.yaml \
  --set image.tag=${{ github.sha }}
```

---

### Step 4: Developer Closes or Merges the PR

- **Workflow Triggered:** `on_pr_closed.yaml`
- **Action:**
  - Deletes the Helm release associated with the PR.
  - Removes the Docker image tagged with the Git SHA from GHCR.

---

### Step 5: PR Merged to `main` Branch (Production CI/CD)

- **Workflow Triggered:** `on_push_main.yaml`
- **Action:**
  - Reuses the same Dockerfiles under `apps/<appname>/Dockerfile`.
  - Trivy scan is repeated for compliance.
  - Tags images with `latest` and `<commit-sha>`.
  - Pushes production-ready images to GHCR.
  - Automatically deploys to the **Development** environment using Helm with `values-dev.yaml`.

---

### Step 6: Manual Promotion to Staging/Production

- **Action Required:** Manual approval in GitHub Actions UI.
- Uses environment-specific Helm values (`values-staging.yaml`, `values-prod.yaml`).
- Promotes tested build to Staging or Production environments.

---

## Helm Charts Overview

The `charts/bc-wallet` Helm chart is structured to deploy multiple services (API server, demo server, traction adapter, demo web, showcase creator, etc.) under a unified release. It follows a modular structure using a shared base while keeping each service's deployment logic isolated.

The `templates/` directory includes the following service-specific folders:
- `api-server/`
- `demo-server/`
- `demo-web/`
- `showcase-creator/`
- `traction-adapter/`

These directories contain Kubernetes manifests such as `deployment.yaml`, `service.yaml`, `hpa.yaml`, `networkpolicy.yaml`, and `serviceaccount.yaml` for each component.

There is also a `common/` directory for shared templates like `authtoken-secret.yaml`, `configmap.yaml`, and shared network policies.


The `charts/bc-wallet` Helm chart is structured to deploy multiple services (API server, demo server, traction adapter, etc.) under a unified release. It follows a modular structure using a shared base while keeping each service's deployment logic isolated.

Helm is used to package and deploy the Kubernetes resources for each environment. - A `Chart.yaml` file defining the chart name, version, and metadata.
- A top-level `values.yaml` file defining default image tags, ports, and configuration.
- A `templates/` directory, further divided by service (`api-server/`, `demo-server/`, `traction-adapter/`, etc.). Each service folder includes:
  - `deployment.yaml`: Defines deployment logic, typically templated with `.Values.image.tag` and environment variables.
  - `service.yaml`: Configures Kubernetes Service resources.
  - `hpa.yaml`: Enables Horizontal Pod Autoscaler based on metrics.
  - `networkpolicy.yaml`: Applies fine-grained network controls.
  - `serviceaccount.yaml`: Manages RBAC and pod identities.
- A `common/` folder used to share secrets (`authtoken-secret.yaml`), config maps, or policies used across multiple services.
- `_helpers.tpl` provides reusable template functions for naming and labeling.
- `ingress.yaml` controls public exposure and routes for HTTP traffic.

At runtime, Helm reads from `values-<env>.yaml` files to inject environment-specific configurations. For example:
- PR environments: `values-pr.yaml`
- Development: `values-dev.yaml`
- Staging: `values-staging.yaml`
- Production: `values-prod.yaml`

Helm's release name (e.g., `bc-wallet-pr-123`) is unique per environment or PR, ensuring each deployment is isolated. All Kubernetes resources—deployments, secrets, services—are managed as part of this release. The image tag is passed via `--set image.tag=<git-sha>` ensuring precise versioning for each deployable component.

---

## Secrets Management

- Secrets are managed using **GitHub Actions Secrets**.
- Values are injected into the environment and accessible in the pipeline.

```yaml
- name: Set environment
  run: echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> $GITHUB_ENV
```

---

## Image Tagging Strategy

| Use Case         | Tag Format     |
| ---------------- | -------------- |
| Ephemeral PR     | `<commit-sha>` |
| Development/Main | `latest`       |
| Traceability     | `<commit-sha>` |

Ephemeral images and Helm releases are deleted on PR closure.

---

## Directory Structure (Relevant to DevOps)

```
.github/workflows/
  |- cicd.yaml
  |- on_pr_opened.yaml
  |- on_pr_closed.yaml
  |- on_push_main.yaml

apps/
  |- <appname>/
     |- Dockerfile
     |- (application code)

charts/
  |- bc-wallet/
     |- Chart.yaml
     |- templates/
     |- values-dev.yaml
     |- values-pr.yaml
     |- values-staging.yaml
     |- values-prod.yaml
```


---

This step-by-step document ensures developers and DevOps engineers understand the chronological order, event triggers, CI/CD boundaries, Helm-based deployments, image tagging conventions, and the role of GitHub Actions in orchestrating the pipeline.


