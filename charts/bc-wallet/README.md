# BC Wallet Helm Chart

This Helm chart is used to deploy the BC Wallet Showcase Builder.

## Prerequisites

- Kubernetes cluster (tested on OpenShift).
- Helm v3+ installed.
- `kubectl` or `oc` configured to interact with your cluster.

## Installation

1. **Create a secret(s) for OIDC and other secret values**
    ```bash
    kubectl create secret generic bc-wallet-secrets \
      --from-literal=API_KEY='Your API key' \
      --from-literal=ENCRYPTION_KEY='Your Encryption key' \
      --from-literal=OIDC_ROOT_CLIENT_ID='Your OIDC Root Client ID' \
      --from-literal=OIDC_ROOT_CLIENT_SECRET='Your OIDC Root client secret' \
      --from-literal=OIDC_ROOT_ISSUER_URL='Your OIDC Root issuer URL' \
      --from-literal=OIDC_REALM='Your OIDC realm' \
      --from-literal=OIDC_TRUST_HOST='Your OIDC trust host' \
      --from-literal=OIDC_DEFAULT_TENANT='Your OIDC default tenant ID' \
      --from-literal=NEXT_AUTH_SECRET='Your Next Auth secret' \
      --from-literal=TRACTION_API_URL='Your Traction API URL' \
      --from-literal=TRACTION_WEBHOOK_SECRET='Your Traction webhook secret' \
      --from-literal=WALLET_ID='Your Wallet ID'
    ```
    _Note: If necessary, you can create multiple secrets for different services. For example, `bc-wallet-api-secrets`, `bc-wallet-demo-server-secrets`, etc._
2. **Customize Values**:  
   Edit `values.yaml` or create a custom `my-values.yaml` file with overrides.
   Make sure to update `extraEnvVarsSecret` values for each service.

3. **Install/Upgrade**:  
   Use the following command to deploy the chart:

   ```bash
   helm upgrade --install bc-wallet --namespace <your-namespace> -f ./charts/bc-wallet/values.yaml ./charts/bc-wallet
   ```
