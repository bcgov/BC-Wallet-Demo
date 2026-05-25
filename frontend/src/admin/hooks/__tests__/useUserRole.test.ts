import { useAuth } from 'react-oidc-context'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useUserRole, useHasRole } from '../useUserRole'

// Mock the react-oidc-context
vi.mock('react-oidc-context')

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBeNull()
  })

  it('should return null when user has no realm_access', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {},
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBeNull()
  })

  it('should return null when user has no roles', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {},
      },
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBeNull()
  })

  it('should return admin role when user has admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['admin', 'default-roles-showcase'],
        },
      },
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBe('admin')
  })

  it('should return creator role when user has creator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['creator', 'default-roles-showcase'],
        },
      },
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBe('creator')
  })

  it('should return viewer role when user only has viewer role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['viewer', 'default-roles-showcase'],
        },
      },
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBe('viewer')
  })

  it('should prioritize admin role over other roles', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['viewer', 'creator', 'admin'],
        },
      },
    } as never)

    const { result } = renderHook(() => useUserRole())
    expect(result.current).toBe('admin')
  })
})

describe('useHasRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as never)

    const { result } = renderHook(() => useHasRole('creator'))
    expect(result.current).toBe(false)
  })

  it('admin user should have admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['admin'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('admin'))
    expect(result.current).toBe(true)
  })

  it('admin user should have creator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['admin'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('creator'))
    expect(result.current).toBe(true)
  })

  it('creator user should have creator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['creator'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('creator'))
    expect(result.current).toBe(true)
  })

  it('creator user should not have admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['creator'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('admin'))
    expect(result.current).toBe(false)
  })

  it('viewer user should have viewer role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['viewer'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('viewer'))
    expect(result.current).toBe(true)
  })

  it('viewer user should not have creator role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        realm_access: {
          roles: ['viewer'],
        },
      },
    } as never)

    const { result } = renderHook(() => useHasRole('creator'))
    expect(result.current).toBe(false)
  })
})
