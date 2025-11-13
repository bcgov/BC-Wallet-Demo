# Tenant Management UI - Quick Start Guide

## What Was Built

A web-based admin interface for managing showcase tenants. Replaces command-line scripts with a user-friendly UI.

**Access**: `/[locale]/admin/tenants` (e.g., `/en/admin/tenants`)

**Required Role**: `admin` (realm or client-level in Keycloak)

## Features

✅ **View All Tenants** - List with status, timestamps  
✅ **Create Tenant** - Form with validation  
✅ **Edit Tenant** - Update configuration  
✅ **Delete Tenant** - With confirmation dialog  
✅ **Traction Integration** - Optional connection details  
✅ **Role-Based Access** - Admin users only

## Setup

### 1. Install Dependencies

```bash
cd apps/bc-wallet-showcase-creator
pnpm install
```

### 2. Configure Keycloak

**Option A: Realm Role**
- Keycloak → Realms → BC → Roles → Create `admin`
- Users → [Select User] → Role Mappings → Assign `admin`

**Option B: Client Role** 
- Keycloak → Clients → [tenant-client] → Roles → Create `admin`
- Users → [Select User] → Role Mappings → Client → Assign `admin`

### 3. Test Locally

```bash
pnpm dev
```

Navigate to: `http://localhost:3000/en/admin/tenants`

## File Structure

```
apps/bc-wallet-showcase-creator/
├── lib/api/tenants.ts                     # API client
├── components/admin/
│   └── tenant-form-dialog.tsx             # Form component
├── app/[locale]/(protected)/admin/
│   ├── layout.tsx                         # Admin layout
│   └── tenants/page.tsx                   # Main page
├── middleware.ts                          # Route protection
├── TENANT_MANAGEMENT.md                   # Full documentation
└── RBAC_IMPLEMENTATION.md                 # RBAC details
```

## Usage

### Create a Tenant

1. Click **"Create Tenant"**
2. Fill in:
   - Tenant ID: `showcase-ministry-name`
   - OIDC Issuer: `https://auth.example.com/auth/realms/BC`
   - (Optional) Traction details
3. Click **"Create Tenant"**

### Edit a Tenant

1. Click **pencil icon** next to tenant
2. Modify fields (except Tenant ID)
3. Click **"Update Tenant"**

### Delete a Tenant

1. Click **trash icon** next to tenant
2. Confirm deletion
3. ⚠️ This permanently removes tenant and all data

## API Endpoints

All requests require authentication (session cookies):

```typescript
GET    /tenants           // List all
GET    /tenants/:id       // Get one
POST   /tenants           // Create
PUT    /tenants/:id       // Update
DELETE /tenants/:id       // Delete
```

## Access Control

### Middleware Protection

```typescript
/admin/*  → Requires admin role → Else /unauthorized
/*        → Requires admin role → Else /unauthorized  
/login    → Public
/api/*    → Public (handles own auth)
```

### Role Checking

Admin role checked in:
1. `realm_access.roles[]`
2. `resource_access[clientId].roles[]`

User needs admin in **either** location.

## Troubleshooting

### "Cannot access /admin/tenants"

**Cause**: No admin role assigned  
**Fix**: Assign admin role in Keycloak, then re-login

### "Failed to create tenant"

**Causes**:
- Tenant ID already exists
- OIDC issuer unreachable
- Missing required fields

**Fix**: Check browser console, verify inputs

### TypeScript Errors

**Cause**: Dependencies not installed  
**Fix**: Run `pnpm install` in showcase-creator directory

## Documentation

- **TENANT_MANAGEMENT.md** - Comprehensive guide
- **RBAC_IMPLEMENTATION.md** - RBAC summary  
- **TENANT_MANAGEMENT_IMPLEMENTATION.md** - Technical details

## Testing Checklist

- [ ] Admin user can access `/admin/tenants`
- [ ] Non-admin redirected to `/unauthorized`
- [ ] Can create tenant with required fields
- [ ] Can edit existing tenant
- [ ] Can delete tenant (with confirmation)
- [ ] Duplicate tenant ID rejected
- [ ] Success/error toasts display correctly

## Security Notes

- Session-based authentication via NextAuth.js
- Middleware enforces admin role
- API server independently validates
- API keys shown as password fields
- All operations logged on server

## Support

For issues or questions:
1. Check browser console for errors
2. Review API server logs
3. Consult TENANT_MANAGEMENT.md troubleshooting
4. Contact system administrator
