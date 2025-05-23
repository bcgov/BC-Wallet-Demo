# bc-wallet-api-server

## Environment variables

Please see [.env.example](.env.example) for a list and explanation of all the environment variables.

## Database

There are several environment variables for connecting to a postgres database. A connection url can be used or individual options can be set to connect.
If a connection url is set than this will be favored.

> **_NOTE:_** Currently only PostgreSQL support is available

### Migrations

We generate database migrations using [Drizzle kit](https://orm.drizzle.team/docs/kit-overview), which manages and versions database schema changes. These can be found at `./src/database/migrations`.

#### Generate migrations

Migrations can be generated using the following command

```shell
pnpm migration:generate
```

## Installation

```shell
pnpm install bc-wallet-api-server
```

## Build

```shell
pnpm build
```


## Tenant Management

### Authentication

Before performing any tenant operations, you'll need to authenticate and obtain an access token.

#### PowerShell
```powershell
$tokenResponse = Invoke-RestMethod -Method POST `
  -Uri "https://auth-server/auth/realms/BC/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "grant_type=client_credentials&client_id=showcase-root&client_secret=your_keycloak_root_client_secret"

$token = $tokenResponse.access_token
```

#### cURL
```bash
token=$(curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=showcase-root&client_secret=your_keycloak_root_client_secret" \
  https://auth-server/auth/realms/BC/protocol/openid-connect/token | jq -r '.access_token')
```

### Create a Tenant

#### PowerShell
```powershell
$tenantData = @{
  id = "showcase-tenantA"
  oidcIssuer = "https://auth-server/auth/realms/BC"
  tractionTenantId = "your_traction_tenant_id"
  tractionWalletId = "your_traction_wallet_id"
  tractionApiUrl = "https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca"
  tractionApiKey = "your_traction_api_key"
}

$jsonBody = $tenantData | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://localhost:5005/tenants" `
  -Method Post `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $jsonBody
```

#### cURL
```bash
curl -X POST \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "showcase-tenantA",
    "oidcIssuer": "https://auth-server/auth/realms/BC",
    "tractionTenantId": "your_traction_tenant_id",
    "tractionWalletId": "your_traction_wallet_id",
    "tractionApiUrl": "https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca",
    "tractionApiKey": "your_traction_api_key"
  }' \
  http://localhost:5005/tenants
```

### List All Tenants

#### PowerShell
```powershell
$response = Invoke-RestMethod `
  -Uri "http://localhost:5005/tenants" `
  -Method Get `
  -Headers @{
    "Authorization" = "Bearer $token"
  }

$response.tenants | Format-Table id, oidcIssuer
```

#### cURL
```bash
curl -X GET \
  -H "Authorization: Bearer $token" \
  http://localhost:5005/tenants
```

### Get a Specific Tenant

#### PowerShell
```powershell
$tenantId = "showcase-tenantA"
$response = Invoke-RestMethod `
  -Uri "http://localhost:5005/tenants/$tenantId" `
  -Method Get `
  -Headers @{
    "Authorization" = "Bearer $token"
  }

$response.tenant
```

#### cURL
```bash
curl -X GET \
  -H "Authorization: Bearer $token" \
  http://localhost:5005/tenants/showcase-tenantA
```

### Update a Tenant

#### PowerShell
```powershell
$tenantId = "showcase-tenantA"
$tenantData = @{
  id = "showcase-tenantA"
  oidcIssuer = "https://auth-server/auth/realms/BC"
  tractionTenantId = "updated_traction_tenant_id"
  tractionWalletId = "updated_traction_wallet_id"
  tractionApiUrl = "https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca"
  tractionApiKey = "updated_traction_api_key"
}

$jsonBody = $tenantData | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://localhost:5005/tenants/$tenantId" `
  -Method Put `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $jsonBody
```

#### cURL
```bash
curl -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "showcase-tenantA",
    "oidcIssuer": "https://auth-server/auth/realms/BC",
    "tractionTenantId": "updated_traction_tenant_id",
    "tractionWalletId": "updated_traction_wallet_id",
    "tractionApiUrl": "https://traction-tenant-proxy-test.apps.silver.devops.gov.bc.ca",
    "tractionApiKey": "updated_traction_api_key"
  }' \
  http://localhost:5005/tenants/showcase-tenantA
```

### Delete a Tenant

#### PowerShell
```powershell
$tenantId = "showcase-tenantA"
$response = Invoke-RestMethod `
  -Uri "http://localhost:5005/tenants/$tenantId" `
  -Method Delete `
  -Headers @{
    "Authorization" = "Bearer $token"
  }
```

#### cURL
```bash
curl -X DELETE \
  -H "Authorization: Bearer $token" \
  http://localhost:5005/tenants/showcase-tenantA
```

### Error Handling

For better error handling in PowerShell, you can use try/catch blocks:

```powershell
try {
  $response = Invoke-RestMethod `
    -Uri "http://localhost:5005/tenants" `
    -Method Get `
    -Headers @{
      "Authorization" = "Bearer $token"
    }
} 
catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $errorMessage = $_.ErrorDetails.Message
  Write-Host "Error: $statusCode - $errorMessage"
}
```