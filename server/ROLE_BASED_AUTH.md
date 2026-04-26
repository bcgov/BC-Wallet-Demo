# Role-Based Authentication Guide

This document explains how to use the role-based authentication system in the admin API.

## Overview

The admin API supports two types of role checks:

1. **Realm Roles** — Keycloak-wide roles defined at the realm level
2. **Client Roles** — Application-specific roles defined for a particular client

## Middleware Functions

### `requireAdmin`

Verifies that the request includes a valid Keycloak JWT token. Must be applied to all admin routes.

```typescript
import { requireAdmin } from './middleware/requireAdmin'

app.use(`${baseRoute}/admin`, requireAdmin)
```

### `requireRole(allowedRoles: string[])`

Middleware factory that checks realm-level roles. Must be applied **after** `requireAdmin`.

**Parameters:**

- `allowedRoles` — Array of role names required to access the route

**Example:**

```typescript
import { requireRole } from './middleware/requireAdmin'

// Only users with 'admin' or 'creator' role can POST
router.post('/', requireRole(['admin', 'creator']), (req, res) => {
  res.status(201).json({ created: true })
})
```

**Returns:**

- **401 Unauthorized** — No valid JWT provided (requireAdmin failed)
- **403 Forbidden** — User lacks required roles
- **Next** — User has at least one of the required roles

### `requireClientRole(clientId: string, allowedRoles: string[])`

Middleware factory that checks client-specific roles. Must be applied **after** `requireAdmin`.

**Parameters:**

- `clientId` — The Keycloak client ID (e.g., `'admin-portal'`)
- `allowedRoles` — Array of client role names required to access the route

**Example:**

```typescript
import { requireClientRole } from './middleware/requireAdmin'

// Only users with 'admin' role in the 'admin-portal' client can DELETE
router.delete('/:id', requireClientRole('admin-portal', ['admin']), (req, res) => {
  res.status(204).send()
})
```

**Returns:**

- **401 Unauthorized** — No valid JWT provided
- **403 Forbidden** — User lacks required client roles
- **Next** — User has at least one of the required roles

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

### `userHasClientRole(auth: KeycloakJWT | undefined, clientId: string, role: string): boolean`

Check if a user has a specific client role inside a route handler.

```typescript
router.get('/:id', (req, res) => {
  const auth = req.auth
  if (userHasClientRole(auth, 'admin-portal', 'editor')) {
    // User can view and edit
  }
})
```

## Keycloak Configuration

### Setting Up Realm Roles

1. In Keycloak Admin Console, go to **Realm Roles**
2. Create roles like `admin`, `creator`, `viewer`, `editor`, etc.
3. Assign roles to users in the **Users** section

### Setting Up Client Roles

1. In Keycloak Admin Console, go to **Clients**
2. Open your client (e.g., `admin-portal`)
3. Navigate to **Roles**
4. Create client-specific roles
5. In **Client Scopes**, add a scope that includes the role mapper
6. Users can be assigned client roles via their user profile or client role mappings

### JWT Token Structure

The JWT token will contain role information like:

```json
{
  "sub": "user-id",
  "preferred_username": "john.doe",
  "realm_access": {
    "roles": ["admin", "user", "offline_access", "uma_authorization"]
  },
  "resource_access": {
    "admin-portal": {
      "roles": ["view-dashboard", "edit-characters"]
    }
  }
}
```

## Examples

### Restricting to Admins Only

```typescript
import { requireAdmin, requireRole } from './middleware/requireAdmin'

router.delete('/:id', requireAdmin, requireRole(['admin']), (req, res) => {
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
import { requireAdmin, userHasRole } from './middleware/requireAdmin'

router.get('/stats', requireAdmin, (req, res) => {
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

### Client-Specific Roles

```typescript
import { requireAdmin, requireClientRole } from './middleware/requireAdmin'

router.post('/publish', requireAdmin, requireClientRole('content-app', ['publisher']), (req, res) => {
  // Only users with the 'publisher' role in 'content-app' can publish
  res.json({ published: true })
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
  resource_access?: {
    [clientId: string]: {
      roles: string[] // Client-specific roles
    }
  }
  [key: string]: unknown // Other JWT claims
}
```

## Error Handling

All role-checking middleware returns standard HTTP responses:

- **401 Unauthorized** — Missing or invalid JWT token
- **403 Forbidden** — User authenticated but lacks required roles

These are logged with details:

```
User does not have required role { username: 'john.doe', required: ['admin'], has: ['user'] }
```

## Best Practices

1. **Apply `requireAdmin` globally** to the `/admin` route prefix in `index.ts`
2. **Apply `requireRole()` selectively** only to endpoints that need role restrictions
3. **Use realm roles for broad permissions** (admin, viewer, editor)
4. **Use client roles for fine-grained permissions** (publish, delete, moderate)
5. **Log role check failures** for audit and debugging purposes
6. **Test role restrictions** in your test suite using mocked JWT tokens

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
