# Role-Based Access Control Implementation Summary

## Overview

This document summarizes the implementation of role-based access control (RBAC) for the BC Wallet Showcase Creator application.

## Changes Made

### 1. Authentication Module (`auth.ts`)

**Added:**
- `UserRoles` interface to store realm and client-specific roles
- Extended `Session` type to include roles
- `extractRolesFromToken()` function to parse roles from JWT
- `hasRole()` helper function for role checking
- Role extraction in JWT callback (decodes access token)
- Role assignment in session callback

**Key Code Changes:**
```typescript
export interface UserRoles {
  realmRoles: string[]
  clientRoles: Record<string, string[]>
}

declare module 'next-auth' {
  interface Session {
    user: User & {
      roles?: UserRoles
    }
  }
}
```

### 2. Middleware (`middleware.ts`)

**Added:**
- Role-based authorization check before protected routes
- Unauthorized route handling
- Admin role verification (both realm and client-specific)
- Redirect logic for users without required roles

**Flow:**
1. Check if route is public (login, invalid-tenant, unauthorized, api)
2. For protected routes, check authentication
3. Extract user roles from session
4. Verify admin role exists (realm or client level)
5. Redirect to unauthorized page if role missing
6. Proceed with route if authorized

**Key Code Changes:**
```typescript
const session = await auth()
const userRoles = session.user?.roles
let hasAdminRole = false

if (userRoles) {
  hasAdminRole = userRoles.realmRoles.includes('admin')
  if (!hasAdminRole) {
    for (const clientRoles of Object.values(userRoles.clientRoles)) {
      if (Array.isArray(clientRoles) && clientRoles.includes('admin')) {
        hasAdminRole = true
        break
      }
    }
  }
}
```

### 3. Unauthorized Page

**Created:** `app/unauthorized/page.tsx` and `app/unauthorized/layout.tsx`

**Features:**
- User-friendly error message
- Explains admin role requirement
- Provides link to return home
- Styled with Tailwind CSS matching app theme

### 4. Documentation

**Created:** `RBAC.md` - Comprehensive guide covering:
- Overview of RBAC system
- Required roles (admin)
- Authentication flow
- Keycloak configuration instructions
- Future enhancement plans
- Troubleshooting guide
- Testing procedures

**Updated:** `ARCHITECTURE_OVERVIEW.md` - Security section now includes:
- RBAC implementation details
- Role extraction from JWT tokens
- Three-tier access model (admin, authenticated, unauthenticated)
- Extensibility for future roles

## Role Requirements

### Current Implementation

**Admin Role Required** - Users must have ONE of the following:
- **Realm role:** `admin` (in `realm_access.roles`)
- **Client role:** `admin` (in `resource_access[clientId].roles`)

### Future Extensibility

The system is designed to support additional roles:
- **editor** - Create/modify showcases without approval rights
- **viewer** - Read-only access
- **approver** - Approve credential definitions

## Testing Checklist

- [ ] User without admin role cannot access Showcase Creator
- [ ] User with realm admin role can access Showcase Creator
- [ ] User with client admin role can access Showcase Creator
- [ ] Unauthorized page displays correctly
- [ ] User can log out and log back in after role assignment
- [ ] Roles persist across session refresh
- [ ] API calls include proper authorization headers

## Keycloak Configuration

### Assign Admin Role (Realm Level)

1. Keycloak Admin Console → Realm Settings → Roles
2. Create `admin` role if not exists
3. Users → Select user → Role Mapping
4. Assign `admin` realm role

### Assign Admin Role (Client Level)

1. Keycloak Admin Console → Clients → Select tenant client
2. Roles tab → Create `admin` role
3. Users → Select user → Role Mapping
4. Select client → Assign `admin` client role

## Security Considerations

### Frontend Protection
- Middleware checks roles before rendering protected pages
- Session contains role information for client-side checks
- Unauthorized users are immediately redirected

### Backend Protection
- API server independently validates JWT tokens
- API endpoints use `@Authorized()` decorator
- Token introspection ensures role validity
- Tenant-level isolation maintained

### Token Security
- Roles extracted from signed JWT token
- Token refresh maintains role information
- Short-lived tokens reduce exposure window
- Proper HTTPS in production

## Migration Notes

### Existing Users
- Existing authenticated users without admin role will be blocked
- Users must be assigned admin role in Keycloak
- No database migration required
- Session refresh may be needed after role assignment

### Deployment
1. Deploy code changes
2. Configure admin roles in Keycloak
3. Assign roles to existing users
4. Test with both role types
5. Monitor for unauthorized access attempts

## Files Changed

```
apps/bc-wallet-showcase-creator/
├── auth.ts                          # Modified: Added role extraction
├── middleware.ts                    # Modified: Added role checking
├── RBAC.md                          # New: Documentation
├── app/
│   └── unauthorized/
│       ├── page.tsx                 # New: Unauthorized page
│       └── layout.tsx               # New: Unauthorized layout
ARCHITECTURE_OVERVIEW.md             # Modified: Updated security section
```

## Future Enhancements

1. **Granular Permissions**
   - Different roles for different actions
   - Resource-level permissions
   - Dynamic role assignment

2. **Role Management UI**
   - Admin panel for role assignment
   - User role viewing
   - Audit log for role changes

3. **Additional Roles**
   - Editor role for showcase creation
   - Viewer role for read-only access
   - Approver role for credential approval

4. **Enhanced Security**
   - Multi-factor authentication
   - Role hierarchy
   - Time-based role expiration

## Support

For questions or issues with RBAC implementation, refer to:
- `RBAC.md` for detailed documentation
- Keycloak admin documentation
- BC Wallet Showcase architecture overview
