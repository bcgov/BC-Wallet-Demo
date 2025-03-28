# CI/CD Pipeline Documentation for BC Wallet Demo Project

This document explains the CI/CD pipeline implemented using GitHub Actions for the BC Wallet Demo Project. It covers how code changes trigger builds, scans, deployments, and environment promotions.

---

## CI vs CD: When Do They Happen?

- **CI (Continuous Integration)** kicks in when a **Pull Request is opened or updated**. It includes:
  - Testing
  - Security scanning (Trivy)
  - Docker image build and push

- **CD (Continuous Deployment)** happens when:
  - CI passes for a PR → deploys to an ephemeral PR environment
  - A PR is merged to `main` → deploys to permanent environments (e.g., dev)

---

## CI/CD Pipeline Flow

### Step 1: Developer Opens a Pull Request

- **Workflow Triggered:** `on_pr_opened.yaml`
- **Action:**
  - Starts the CI process
  - Triggers QA, build, scan, and image push

---

### Step 2: Continuous Integration (CI)

Defined in `cicd.yaml`. Each PR goes through:

#### 2.1 QA Phase
- Runs unit tests
- (Planned) Static code analysis with SonarQube

#### 2.2 Build Phase
- Dockerfiles located at: `apps/<appname>/Dockerfile`
- Images built and tagged with `github.sha`

#### 2.3 Security Scan Phase
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/org/project/service:${{ github.sha }}
```

#### 2.4 Push Phase
```yaml
- name: Push to GHCR
  run: docker push ghcr.io/org/project/service:${{ github.sha }}
```

---

### Step 3: PR Environment Deployment

- Continues from `on_pr_opened.yaml`
- Helm uses the `github.sha`-tagged image
- Deploys a Helm release with a unique name per PR

---

### Step 4: PR Closed or Merged

- **Workflow Triggered:** `on_pr_closed.yaml`
- **Action:**
  - Deletes the Helm release
  - Deletes PR Docker image from GHCR

---

### Step 5: PR Merged to `main` Branch

- **Workflow Triggered:** `on_push_main.yaml`
- **Action:**
  - Rebuilds & re-scans images
  - Tags with `latest` and `<commit-sha>`
  - Pushes to GHCR
  - Automatically deploys to **Development**

---

### Step 6: Manual Promotion

- Requires manual approval via GitHub UI
- Helm uses `values-staging.yaml` or `values-prod.yaml`

---

## Secrets Management

- Injected via **GitHub Actions Secrets**
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

---

## Relevant Directory Structure

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
```

