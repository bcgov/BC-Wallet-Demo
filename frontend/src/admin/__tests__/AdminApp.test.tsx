import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AdminApp from '../AdminApp'

const { mockLoadOidcConfig } = vi.hoisted(() => ({
  mockLoadOidcConfig: vi.fn(),
}))

vi.mock('react-oidc-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isLoading: false, isAuthenticated: true }),
}))

vi.mock('../auth/keycloakConfig', () => ({
  loadOidcConfig: mockLoadOidcConfig,
}))

vi.mock('../auth/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}))

vi.mock('../pages/CreatorPage', () => ({
  CreatorPage: () => <div>Creator Page</div>,
}))

vi.mock('../pages/CallbackPage', () => ({
  CallbackPage: () => <div>Callback Page</div>,
}))

const renderAdminApp = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </MemoryRouter>,
  )

describe('AdminApp', () => {
  it('shows a loading indicator while the OIDC config is being fetched', () => {
    // Never resolves — stays in the pending state for the duration of this test.
    mockLoadOidcConfig.mockReturnValue(new Promise(() => undefined))
    renderAdminApp('/admin')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows an error message when loadOidcConfig rejects with an Error', async () => {
    mockLoadOidcConfig.mockRejectedValue(new Error('Network error'))
    renderAdminApp('/admin')
    expect(await screen.findByText('Authentication configuration error: Network error')).toBeInTheDocument()
  })

  it('shows a fallback error message when loadOidcConfig rejects with a non-Error', async () => {
    mockLoadOidcConfig.mockRejectedValue('something went wrong')
    renderAdminApp('/admin')
    expect(
      await screen.findByText('Authentication configuration error: Failed to load authentication configuration.'),
    ).toBeInTheDocument()
  })

  it('renders LoginPage at the index route', async () => {
    mockLoadOidcConfig.mockResolvedValue({ authority: 'http://localhost', client_id: 'test' })
    renderAdminApp('/admin')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders CallbackPage at the callback route', async () => {
    mockLoadOidcConfig.mockResolvedValue({ authority: 'http://localhost', client_id: 'test' })
    renderAdminApp('/admin/callback')
    expect(await screen.findByText('Callback Page')).toBeInTheDocument()
  })

  it('renders CreatorPage at the creator route', async () => {
    mockLoadOidcConfig.mockResolvedValue({ authority: 'http://localhost', client_id: 'test' })
    renderAdminApp('/admin/creator')
    expect(await screen.findByText('Creator Page')).toBeInTheDocument()
  })
})
