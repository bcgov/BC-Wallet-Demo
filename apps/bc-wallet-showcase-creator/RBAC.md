# Role-Based Access Control (RBAC)

## Overview

The Showcase Creator now implements role-based access control to restrict access to authorized users only. Users must be authenticated via Keycloak and have the required role assigned.

## Required Roles

### Admin Role

To access the Showcase Creator application, users must have the **admin** role assigned in Keycloak. This role can be assigned as either:

1. **Realm Role**: `admin` - Applied at the realm level, giving admin access across all clients
2. **Client Role**: `admin` - Applied to the specific tenant client, giving admin access only for that tenant

## How It Works

### Authentication Flow

1. User attempts to access a protected route in the Showcase Creator
2. Middleware checks if the user is authenticated
3. If not authenticated, user is redirected to the login page
4. After successful authentication, middleware extracts roles from the JWT token
5. If user has the `admin` role (realm or client-specific), access is granted
6. If user lacks the admin role, they are redirected to the unauthorized page

### Role Extraction

Roles are extracted from the JWT access token during the authentication callback:

```typescript
// Realm roles
token.realm_access.roles = ['admin', 'user', ...]

// Client-specific roles
token.resource_access[clientId].roles = ['admin', 'editor', ...]
```

Both realm and client-specific admin roles are accepted.

## Configuring Roles in Keycloak

### Option 1: Assign Realm Role

1. Log in to Keycloak Admin Console
2. Navigate to **Realm Settings** > **Roles**
3. Create role named `admin` (if not exists)
4. Navigate to **Users** > Select user
5. Go to **Role Mapping** tab
6. Assign the `admin` realm role

### Option 2: Assign Client Role

1. Log in to Keycloak Admin Console
2. Navigate to **Clients** > Select your tenant client
3. Go to **Roles** tab
4. Create role named `admin` (if not exists)
5. Navigate to **Users** > Select user
6. Go to **Role Mapping** tab
7. Select the client from dropdown
8. Assign the `admin` client role

## Future Enhancements

The RBAC system is designed to be extensible. Future roles may include:

- **editor**: Can create and modify showcases but cannot approve credentials
- **viewer**: Read-only access to showcases
- **approver**: Can approve credential definitions

### Adding New Roles

To add additional roles with different permissions:

1. Update the middleware to check for the new role
2. Create role-specific guards or permission checks in components
3. Update the session type definitions in `auth.ts`
4. Apply guards to specific routes or actions

Example:
```typescript
// Check for editor role
const hasEditorRole = userRoles && (
  userRoles.realmRoles.includes('editor') ||
  Object.values(userRoles.clientRoles).some(roles => roles.includes('editor'))
)
```

## Troubleshooting

### User Cannot Access Showcase Creator

1. Verify user is authenticated successfully
2. Check that user has the `admin` role in Keycloak
3. Ensure role is properly assigned (realm or client-specific)
4. Verify the token includes the role in `realm_access.roles` or `resource_access[clientId].roles`
5. Check browser console for any authentication errors

### Role Not Being Detected

1. Clear browser cache and cookies
2. Log out and log back in to refresh the token
3. Verify token decoding is working in `auth.ts`
4. Check middleware logs for role checking logic

## Testing

To test role-based access:

1. Create a test user in Keycloak without the admin role
2. Attempt to log in and access the Showcase Creator
3. Verify user is redirected to the unauthorized page
4. Assign the admin role to the user
5. Log out and log back in
6. Verify user can now access the Showcase Creator

## API Endpoints

Note that the API server also implements role-based authorization using the `@Authorized()` decorator. The middleware in the Showcase Creator provides an additional layer of frontend protection, but the API remains the source of truth for authorization.
