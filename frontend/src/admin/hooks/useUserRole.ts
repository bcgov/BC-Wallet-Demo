import { useAuth } from 'react-oidc-context'

export type AdminRole = 'admin' | 'creator' | 'viewer'

/**
 * Decode JWT payload without verification (safe here since token comes from OIDC provider).
 * Returns the decoded payload object.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(atob(parts[1])) as Record<string, unknown>
    return decoded
  } catch {
    return null
  }
}

/**
 * Custom hook to check if the authenticated user has a specific admin role.
 *
 * This hook extracts the admin role from the Keycloak access token's realm_access.roles claim.
 * The token is issued by Keycloak and already contains role information.
 *
 * @returns {AdminRole | null} The user's admin role, or null if not found or not authenticated
 */
export function useUserRole(): AdminRole | null {
  const auth = useAuth()

  if (!auth.isAuthenticated || !auth.user?.access_token) {
    return null
  }

  // Decode the JWT access token to extract roles
  const decoded = decodeJwt(auth.user.access_token)
  if (!decoded) {
    return null
  }

  // Extract realm roles from the token payload
  const realmRoles = (decoded.realm_access as unknown as Record<string, unknown>)?.roles as string[] | undefined

  // Find the highest priority role among admin-related roles
  // Priority order: admin > creator > viewer
  if (realmRoles) {
    if (realmRoles.includes('admin')) return 'admin'
    if (realmRoles.includes('creator')) return 'creator'
    if (realmRoles.includes('viewer')) return 'viewer'
  }

  return null
}

/**
 * Check if the user has a specific role or higher.
 * Role hierarchy: admin > creator > viewer
 *
 * @param requiredRole The role to check for
 * @returns true if the user has the required role or higher
 */
export function useHasRole(requiredRole: AdminRole): boolean {
  const userRole = useUserRole()

  if (!userRole) return false

  const roleHierarchy: Record<AdminRole, number> = {
    admin: 3,
    creator: 2,
    viewer: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
