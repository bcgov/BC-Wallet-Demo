# BC Wallet Helm Chart - Secret Management

## Overview

This document describes the secret management architecture for the BC Wallet Helm chart. The chart uses a principle of **least privilege** approach where each component only has access to the secrets it needs, and shared secrets are used when multiple components require the same credentials.

## Secret Structure

### Component-Specific Secrets

These secrets contain credentials used by only one component:

#### 1. `bc-wallet-showcase-api-server-secrets`
**Used by:** api-server only  
**Required keys:**
- `OIDC_ROOT_CLIENT_ID` - OIDC client identifier for API server authentication
- `OIDC_ROOT_CLIENT_SECRET` - OIDC client secret for API server authentication
- `OIDC_ROOT_ISSUER_URL` - OIDC issuer URL (typically Keycloak endpoint)

**Configuration in values.yaml:**
```yaml
apiServer:
  secretName: "bc-wallet-showcase-api-server-secrets"
```

#### 2. `bc-wallet-showcase-showcase-creator-secrets`
**Used by:** showcase-creator only  
**Required keys:**
- `NEXT_AUTH_SECRET` - NextAuth.js session encryption secret (must be 32+ characters)
- `OIDC_DEFAULT_TENANT` - Default tenant ID for OIDC authentication
- `OIDC_TRUST_HOST` - Trusted host configuration for OIDC (usually "true")

**Configuration in values.yaml:**
```yaml
showcaseCreator:
  secretName: "bc-wallet-showcase-showcase-creator-secrets"
```

### Shared Secrets

These secrets contain credentials shared by multiple components:

#### 3. `bc-wallet-showcase-traction-shared`
**Used by:** demo-server, traction-adapter  
**Required keys:**
- `TRACTION_API_URL` - Base URL for Traction API
- `WALLET_ID` - Traction wallet identifier
- `API_KEY` - Traction API authentication key
- `OIDC_DEFAULT_TENANT` - Default tenant ID for Traction

**Configuration in values.yaml:**
```yaml
demoServer:
  tractionSecretName: "bc-wallet-showcase-traction-shared"

tractionAdapter:
  tractionSecretName: "bc-wallet-showcase-traction-shared"
```

#### 4. `bc-wallet-showcase-encryption-shared`
**Used by:** api-server, traction-adapter  
**Required keys:**
- `ENCRYPTION_KEY` - Shared encryption key for data encryption (must be 32 bytes hex-encoded)

**Configuration in values.yaml:**
```yaml
apiServer:
  encryptionSecretName: "bc-wallet-showcase-encryption-shared"

tractionAdapter:
  encryptionSecretName: "bc-wallet-showcase-encryption-shared"
```

#### 5. `bc-wallet-showcase-webhooks-shared`
**Used by:** demo-server  
**Required keys:**
- `TRACTION_WEBHOOK_SECRET` - Secret for authenticating Traction webhook callbacks

**Configuration in values.yaml:**
```yaml
demoServer:
  webhookSecretName: "bc-wallet-showcase-webhooks-shared"
```

### Infrastructure Secrets

These secrets are managed by dependent Helm charts and referenced via helper functions:

#### 6. PostgreSQL Secret
**Managed by:** postgresql subchart  
**Default name:** `<release-name>-postgresql`  
**Referenced by:** api-server  
**Keys used:**
- `password` - PostgreSQL user password

**Helper functions:**
- `bc-wallet.database.secret.name` - Returns the secret name
- `bc-wallet.database.userPasswordKey` - Returns the password key name

#### 7. RabbitMQ Secret
**Managed by:** rabbitmq subchart  
**Default name:** `<release-name>-rabbitmq`  
**Referenced by:** api-server, traction-adapter  
**Keys used:**
- `rabbitmq-password` - RabbitMQ user password

**Helper functions:**
- `bc-wallet.rabbitmq.secret.name` - Returns the secret name
- `bc-wallet.rabbitmq.passwordKey` - Returns the password key name

## Component Secret Matrix

| Component | Secrets Used | Purpose |
|-----------|--------------|---------|
| api-server | bc-wallet-showcase-api-server-secrets | OIDC authentication |
| api-server | bc-wallet-showcase-encryption-shared | Data encryption |
| api-server | postgresql secret | Database access |
| api-server | rabbitmq secret | Message queue access |
| demo-server | bc-wallet-showcase-traction-shared | Traction API access |
| demo-server | bc-wallet-showcase-webhooks-shared | Webhook validation |
| showcase-creator | bc-wallet-showcase-showcase-creator-secrets | NextAuth & OIDC |
| traction-adapter | bc-wallet-showcase-traction-shared | Traction API access |
| traction-adapter | bc-wallet-showcase-encryption-shared | Data encryption |
| traction-adapter | rabbitmq secret | Message queue access |
| demo-web | (none) | No secret access needed |

## Creating Secrets

### Example: Component-Specific Secrets

```bash
# API Server OIDC credentials
kubectl create secret generic bc-wallet-showcase-api-server-secrets \
  --from-literal=OIDC_ROOT_CLIENT_ID='your-client-id' \
  --from-literal=OIDC_ROOT_CLIENT_SECRET='your-client-secret' \
  --from-literal=OIDC_ROOT_ISSUER_URL='https://keycloak.example.com/realms/your-realm' \
  -n your-namespace

# Showcase Creator authentication
kubectl create secret generic bc-wallet-showcase-showcase-creator-secrets \
  --from-literal=NEXT_AUTH_SECRET='your-long-random-secret-32-chars-minimum' \
  --from-literal=OIDC_DEFAULT_TENANT='your-tenant-id' \
  --from-literal=OIDC_TRUST_HOST='true' \
  -n your-namespace
```

### Example: Shared Secrets

```bash
# Traction credentials (shared by demo-server and traction-adapter)
kubectl create secret generic bc-wallet-showcase-traction-shared \
  --from-literal=TRACTION_API_URL='https://traction.example.com' \
  --from-literal=WALLET_ID='your-wallet-id' \
  --from-literal=API_KEY='your-api-key' \
  --from-literal=OIDC_DEFAULT_TENANT='your-tenant-id' \
  -n your-namespace

# Encryption key (shared by api-server and traction-adapter)
kubectl create secret generic bc-wallet-showcase-encryption-shared \
  --from-literal=ENCRYPTION_KEY='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' \
  -n your-namespace

# Webhook secret
kubectl create secret generic bc-wallet-showcase-webhooks-shared \
  --from-literal=TRACTION_WEBHOOK_SECRET='your-webhook-secret' \
  -n your-namespace
```

### Using External Secret Management

For production environments, consider using external secret management solutions:

#### Using Sealed Secrets

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: bc-wallet-showcase-api-server-secrets
  namespace: bc-wallet
spec:
  encryptedData:
    OIDC_ROOT_CLIENT_ID: AgBj...
    OIDC_ROOT_CLIENT_SECRET: AgCd...
    OIDC_ROOT_ISSUER_URL: AgAe...
```

#### Using External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: bc-wallet-showcase-api-server-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: SecretStore
    name: vault-backend
  target:
    name: bc-wallet-showcase-api-server-secrets
  data:
  - secretKey: OIDC_ROOT_CLIENT_ID
    remoteRef:
      key: secret/bc-wallet/api-server
      property: oidc_client_id
  - secretKey: OIDC_ROOT_CLIENT_SECRET
    remoteRef:
      key: secret/bc-wallet/api-server
      property: oidc_client_secret
  - secretKey: OIDC_ROOT_ISSUER_URL
    remoteRef:
      key: secret/bc-wallet/api-server
      property: oidc_issuer_url
```

## Migration Guide

### Migrating from Single `bc-wallet-showcase-secrets`

If you're upgrading from a previous version where all secrets were in a single `bc-wallet-showcase-secrets` secret:

#### Step 1: Review Current Secrets

```bash
kubectl get secret bc-wallet-showcase-secrets -n your-namespace -o yaml
```

#### Step 2: Create New Isolated Secrets

Extract the keys from `bc-wallet-showcase-secrets` and create the new isolated secrets:

```bash
# Extract current values (example)
export OIDC_CLIENT_ID=$(kubectl get secret bc-wallet-showcase-secrets -n your-namespace -o jsonpath='{.data.OIDC_ROOT_CLIENT_ID}' | base64 -d)
export OIDC_CLIENT_SECRET=$(kubectl get secret bc-wallet-showcase-secrets -n your-namespace -o jsonpath='{.data.OIDC_ROOT_CLIENT_SECRET}' | base64 -d)
# ... extract other values ...

# Create new secrets
kubectl create secret generic bc-wallet-showcase-api-server-secrets \
  --from-literal=OIDC_ROOT_CLIENT_ID="$OIDC_CLIENT_ID" \
  --from-literal=OIDC_ROOT_CLIENT_SECRET="$OIDC_CLIENT_SECRET" \
  --from-literal=OIDC_ROOT_ISSUER_URL="$OIDC_ISSUER_URL" \
  -n your-namespace

# Repeat for other secrets...
```

#### Step 3: Upgrade Helm Chart

```bash
helm upgrade bc-wallet ./charts/bc-wallet \
  -n your-namespace \
  -f your-values.yaml
```

#### Step 4: Verify Deployment

```bash
# Check that all pods are running
kubectl get pods -n your-namespace

# Verify secret mounts
kubectl get pod <api-server-pod> -n your-namespace -o jsonpath='{.spec.containers[0].env}' | jq
```

#### Step 5: Clean Up (Optional)

Once verified, you can remove the old secret:

```bash
kubectl delete secret bc-wallet-showcase-secrets -n your-namespace
```

## Security Best Practices

### 1. **Secret Rotation**

Regularly rotate secrets, especially:
- OIDC client secrets
- API keys
- Encryption keys (requires data migration)
- Webhook secrets

### 2. **Access Control**

Use RBAC to restrict secret access:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: bc-wallet-showcase-secret-reader
  namespace: bc-wallet
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: 
    - bc-wallet-showcase-api-server-secrets
    - bc-wallet-showcase-traction-shared
  verbs: ["get"]
```

### 3. **Audit Logging**

Enable Kubernetes audit logging to track secret access:

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  resources:
  - group: ""
    resources: ["secrets"]
  namespaces: ["bc-wallet"]
```

### 4. **Encryption at Rest**

Ensure etcd encryption is enabled for secrets:

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-secret>
  - identity: {}
```

### 5. **Secret Scanning**

- Never commit secrets to version control
- Use pre-commit hooks to scan for secrets
- Implement secret scanning in CI/CD pipelines

### 6. **Least Privilege**

Each component only has access to the secrets it needs. This minimizes:
- Attack surface if a component is compromised
- Risk of accidental secret exposure
- Complexity of secret management

## Troubleshooting

### Pod Not Starting - Secret Not Found

```bash
# Check if secret exists
kubectl get secret bc-wallet-showcase-api-server-secrets -n your-namespace

# If missing, create it
kubectl create secret generic bc-wallet-showcase-api-server-secrets \
  --from-literal=OIDC_ROOT_CLIENT_ID='...' \
  --from-literal=OIDC_ROOT_CLIENT_SECRET='...' \
  --from-literal=OIDC_ROOT_ISSUER_URL='...' \
  -n your-namespace
```

### Missing Secret Keys

```bash
# View secret keys
kubectl get secret bc-wallet-showcase-api-server-secrets -n your-namespace -o jsonpath='{.data}' | jq 'keys'

# Add missing key
kubectl patch secret bc-wallet-showcase-api-server-secrets -n your-namespace \
  --type='json' \
  -p='[{"op": "add", "path": "/data/MISSING_KEY", "value": "'$(echo -n 'value' | base64)'"}]'
```

### Authentication Failures

Check that secret values are correctly formatted:

```bash
# Decode and verify secret value
kubectl get secret bc-wallet-showcase-api-server-secrets -n your-namespace \
  -o jsonpath='{.data.OIDC_ROOT_CLIENT_ID}' | base64 -d
```

## Additional Resources

- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [Helm Secrets](https://github.com/jkroepke/helm-secrets)
