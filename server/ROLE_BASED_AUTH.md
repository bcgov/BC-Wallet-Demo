# Role-Based Authentication Guide

This document explains how to use the role-based authentication system in the admin API.

## Overview

The admin API supports role-based access control using **realm-level roles** defined in Keycloak.

## Middleware Functions

### `requireAdmin`

Verifies that the request includes a valid Keycloak JWT token. Must be applied to all admin routes.

```typescript
import { requireAdmin } from './middleware/requireAdmin'

app.use(`${baseRoute}/admin`, requireAdmin)
```

**Note:** When `requireAdmin` is mounted globally on a path prefix (as shown above), route-specific middleware like `requireRole()` can be applied without explicitly chaining `requireAdmin` again. Examples below assume this global setup unless otherwise specified.

### `requireRole(allowedRoles: string[])`

Middleware factory that checks realm-level roles. Must be applied **after** `requireAdmin`.

**Parameters:**

- `allowedRoles`: array of role names required to access the route

**Example:**

```typescript
import { requireRole } from './middleware/requireAdmin'

// Only users with 'admin' or 'creator' role can POST
// (Note: requireAdmin is already applied globally to the /admin prefix)
router.post('/', requireRole(['admin', 'creator']), (req, res) => {
  res.status(201).json({ created: true })
})
```

**If not using a global `requireAdmin` mount**, include it explicitly:

```typescript
import { requireAdmin, requireRole } from './middleware/requireAdmin'

router.post('/', requireAdmin, requireRole(['admin', 'creator']), (req, res) => {
  res.status(201).json({ created: true })
})
```

**Returns:**

- **401 Unauthorized**: No valid JWT provided (requireAdmin failed)
- **403 Forbidden**: User lacks required roles
- **Next**: User has at least one of the required roles

## Utility Functions

### `userHasRole(auth: KeycloakJWT | undefined, role: string): boolean`

Check if a user has a specific realm role inside a route handler.

```typescript
router.get('/', (req, res) => {
  const auth = req.auth
  if (userHasRole(auth, 'admin')) {
    // Show admin-only data
  } else {
    // Show limited data
  }
})
```

## Keycloak Configuration

### Setting Up Realm Roles

1. In Keycloak Admin Console, go to **Realm Roles**
2. Create roles like `admin`, `creator`, `viewer`, etc.
3. Assign roles to users in the **Users** section

### JWT Token Structure

The JWT token will contain role information like:

```json
{
  "sub": "user-id",
  "preferred_username": "john.doe",
  "realm_access": {
    "roles": ["admin", "user", "offline_access", "uma_authorization"]
  }
}
```

## Examples

### Restricting to Admins Only

```typescript
import { requireRole } from './middleware/requireAdmin'

// Assuming requireAdmin is mounted globally on the /admin prefix:
router.delete('/:id', requireRole(['admin']), (req, res) => {
  // Only admins can delete
  res.status(204).send()
})
```

### Multiple Allowed Roles

```typescript
// Anyone with 'admin' or 'editor' role can update
router.put('/:id', requireAdmin, requireRole(['admin', 'editor']), (req, res) => {
  // Update logic here
  res.json({ updated: true })
})
```

### Conditional Logic Inside Handler

```typescript
import { userHasRole } from './middleware/requireAdmin'

// Assuming requireAdmin is mounted globally on the /admin prefix:
router.get('/stats', (req, res) => {
  const auth = req.auth

  // All authenticated users see basic stats
  const stats = { views: 100 }

  // Only admins see detailed stats
  if (userHasRole(auth, 'admin')) {
    stats.revenue = 5000
    stats.users = 250
  }

  res.json(stats)
})
```

## TypeScript Type Safety

The `req.auth` property is typed as `KeycloakJWT` which includes:

```typescript
export interface KeycloakJWT {
  sub: string // Subject (user ID)
  preferred_username?: string // Username
  name?: string // Full name
  email?: string // Email
  realm_access?: {
    roles: string[] // Realm-level roles
  }
  [key: string]: unknown // Other JWT claims
}
```

## Error Handling

All role-checking middleware returns standard HTTP responses:

- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User authenticated but lacks required roles

These are logged with details:

```
User does not have required role { username: 'john.doe', required: ['admin'], has: ['user'] }
```

## Best Practices

1. **Apply `requireAdmin` globally** to the `/admin` route prefix in `index.ts`
2. **Apply `requireRole()` selectively** only to endpoints that need role restrictions
3. **Use realm roles for granular permissions** (admin, creator, viewer)
4. **Log role check failures** for audit and debugging purposes
5. **Test role restrictions** in your test suite using mocked JWT tokens

## Testing

When testing protected endpoints, mock the JWT token with appropriate roles:

```typescript
// Mock req.auth in tests
const mockAuth: KeycloakJWT = {
  sub: 'test-user',
  preferred_username: 'test',
  realm_access: {
    roles: ['admin'],
  },
}

// In your test request:
req.auth = mockAuth
```
