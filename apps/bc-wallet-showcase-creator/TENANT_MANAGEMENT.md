# Tenant Management UI

## Overview

The Tenant Management UI provides administrators with a web-based interface to manage showcase tenants through the BC Wallet Showcase Creator application. This replaces the command-line scripts documented in the API server README with a user-friendly admin panel.

## Access Control

**Admin Role Required**: Only users with the `admin` role can access the tenant management interface.

### Role Configuration

The admin role can be assigned at two levels in Keycloak:

1. **Realm Role**: `admin` role in `realm_access.roles`
2. **Client Role**: `admin` role in `resource_access[clientId].roles`

Users with either role type can access the tenant management features.

### Route Protection

- **URL**: `/[locale]/admin/tenants`
- **Protection**: Middleware checks for admin role before allowing access
- **Redirects**: 
  - Unauthenticated users → `/[locale]/[tenant]/login`
  - Authenticated users without admin role → `/unauthorized`

## Features

### 1. View All Tenants

- Display list of all configured showcase tenants
- Show tenant ID, OIDC issuer, Traction connection status
- Display creation and update timestamps
- Refresh tenant list on demand

### 2. Create Tenant

**Required Fields:**
- **Tenant ID**: Unique identifier (e.g., `showcase-tenantA`)
- **OIDC Issuer**: Keycloak realm URL (e.g., `https://auth-server/auth/realms/BC`)

**Optional Fields:**
- **Traction Tenant ID**: UUID from Traction platform
- **Traction Wallet ID**: UUID of the wallet
- **Traction API URL**: Traction tenant proxy endpoint
- **Traction API Key**: Authentication key for Traction API

**Validation:**
- Tenant ID must be unique
- OIDC Issuer must be valid URL
- All UUID fields validated for format

### 3. Edit Tenant

- Update existing tenant configuration
- Tenant ID cannot be changed (immutable)
- All other fields can be modified
- Updates preserve existing relationships (showcases, credentials, etc.)

### 4. Delete Tenant

- Permanently remove tenant and associated data
- Confirmation dialog prevents accidental deletion
- Cascade deletes related showcases, credentials, and configurations
- **WARNING**: This action cannot be undone

## UI Components

### Tenant List Table

| Column | Description |
|--------|-------------|
| Tenant ID | Unique tenant identifier |
| OIDC Issuer | Keycloak authentication endpoint |
| Traction Tenant | Connection status badge (Connected/Not Connected) |
| Created | Timestamp of tenant creation |
| Updated | Last modification timestamp |
| Actions | Edit and Delete buttons |

### Tenant Form Dialog

Modal dialog for creating and editing tenants with:
- Form validation
- Error handling and display
- Loading states during submission
- Password field for API key (hidden input)
- Helpful descriptions for each field

### Delete Confirmation

Alert dialog showing:
- Tenant ID being deleted
- Warning about permanent data loss
- Cancel and Confirm actions
- Destructive styling for delete action

## API Integration

The UI communicates with the BC Wallet API Server through the tenant management API client:

### Endpoints Used

```typescript
GET    /tenants           // List all tenants
GET    /tenants/:id       // Get specific tenant
POST   /tenants           // Create new tenant
PUT    /tenants/:id       // Update tenant
DELETE /tenants/:id       // Delete tenant
```

### Authentication

All API requests include:
- **Method**: Session-based authentication (cookies)
- **Credentials**: `include` for cross-origin requests
- **Headers**: `Content-Type: application/json`

### Error Handling

The UI handles various error scenarios:
- Network failures
- Authentication errors (401/403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

All errors display user-friendly toast notifications.

## File Structure

```
apps/bc-wallet-showcase-creator/
├── lib/api/
│   └── tenants.ts                    # Tenant API client
├── components/admin/
│   └── tenant-form-dialog.tsx        # Create/Edit form component
├── app/[locale]/(protected)/admin/
│   ├── layout.tsx                    # Admin panel layout
│   └── tenants/
│       └── page.tsx                  # Main tenant management page
└── middleware.ts                     # Route protection (updated)
```

## Usage Instructions

### For Administrators

1. **Access the Admin Panel**
   ```
   https://showcase-creator.example.com/en/admin/tenants
   ```

2. **Create a New Tenant**
   - Click "Create Tenant" button
   - Fill in required fields (Tenant ID, OIDC Issuer)
   - Optionally add Traction integration details
   - Click "Create Tenant"

3. **Edit Existing Tenant**
   - Click pencil icon next to tenant in list
   - Modify fields as needed
   - Click "Update Tenant"

4. **Delete a Tenant**
   - Click trash icon next to tenant
   - Confirm deletion in dialog
   - Tenant and all related data will be removed

5. **Refresh List**
   - Click refresh icon to reload tenant list
   - Useful after external changes

### Best Practices

1. **Tenant ID Naming**
   - Use descriptive, lowercase names
   - Include "showcase" prefix for clarity
   - Example: `showcase-ministry-name`

2. **OIDC Configuration**
   - Verify Keycloak realm exists before creating tenant
   - Ensure OIDC issuer URL is accessible
   - Test authentication after tenant creation

3. **Traction Integration**
   - Create Traction tenant first
   - Keep API keys secure
   - Test credential issuance after configuration

4. **Security**
   - Only assign admin role to trusted users
   - Regularly audit tenant configurations
   - Monitor for unauthorized access attempts

## Comparison with CLI Approach

### Before (Command-Line)

```bash
# Authenticate
token=$(curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=showcase-root&client_secret=SECRET" \
  https://auth-server/auth/realms/BC/protocol/openid-connect/token | jq -r '.access_token')

# Create tenant
curl -X POST \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "showcase-tenantA",
    "oidcIssuer": "https://auth-server/auth/realms/BC",
    ...
  }' \
  http://localhost:5005/tenants
```

### Now (Web UI)

1. Navigate to `/admin/tenants`
2. Click "Create Tenant"
3. Fill form
4. Click "Create"

✅ **Benefits**: No command-line knowledge required, visual feedback, validation, error handling

## Troubleshooting

### Cannot Access Admin Panel

**Symptom**: Redirected to `/unauthorized` page

**Solution**:
1. Verify you're logged in
2. Check admin role in Keycloak:
   - Realm roles → admin
   - OR Client roles → [tenant-client] → admin
3. Log out and log back in to refresh session
4. Contact system administrator if role should be assigned

### Tenant Creation Fails

**Symptom**: Error toast displays "Failed to create tenant"

**Common Causes**:
1. Tenant ID already exists (must be unique)
2. OIDC issuer URL is invalid or unreachable
3. Missing required fields
4. Network connectivity issues
5. API server is down

**Solution**:
- Check browser console for detailed error
- Verify all required fields are filled
- Test OIDC issuer URL in browser
- Contact system administrator

### Cannot Delete Tenant

**Symptom**: Delete operation fails

**Common Causes**:
1. Tenant has active showcases
2. API server prevents deletion
3. Permission issues

**Solution**:
- Check if tenant has related data
- Contact system administrator for manual deletion if needed

## Security Considerations

### Authentication
- Session-based authentication through NextAuth.js
- Keycloak OIDC integration
- Automatic session refresh

### Authorization
- Middleware enforces admin role requirement
- API server validates permissions independently
- Client-side checks for UI rendering only

### Data Protection
- Traction API keys displayed as password fields
- No sensitive data logged to console (production)
- HTTPS required in production

### Audit Trail
- All tenant operations logged on server
- Timestamps track creation and modifications
- Consider adding audit log viewer in future

## Future Enhancements

Potential improvements for the tenant management UI:

1. **Bulk Operations**
   - Import tenants from CSV
   - Export tenant configurations
   - Bulk delete with confirmation

2. **Enhanced Search & Filter**
   - Search by tenant ID or OIDC issuer
   - Filter by Traction connection status
   - Sort by creation date, update date

3. **Tenant Health Monitoring**
   - Connection status to Traction
   - Last activity timestamp
   - Showcase count per tenant

4. **Validation Enhancements**
   - Real-time OIDC issuer validation
   - Traction connection testing
   - UUID format validation

5. **Audit Log Viewer**
   - View tenant modification history
   - Track who made changes
   - Filter by date range

6. **Role Management Integration**
   - Assign users to tenants
   - Manage tenant-specific roles
   - View user access per tenant

## Related Documentation

- [RBAC Implementation](./RBAC_IMPLEMENTATION.md) - Role-based access control details
- [RBAC Documentation](./RBAC.md) - Authentication and authorization overview
- [API Server README](../bc-wallet-api-server/README.md) - API endpoints documentation
- [Architecture Overview](../../ARCHITECTURE_OVERVIEW.md) - System architecture
