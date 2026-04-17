import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AdminApp from '../AdminApp'

vi.mock('react-oidc-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isLoading: false, isAuthenticated: true }),
}))

vi.mock('../auth/keycloakConfig', () => ({
  loadOidcConfig: () => Promise.resolve({ authority: 'http://localhost', client_id: 'test' }),
  memStore: { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() },
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
  it('renders LoginPage at the index route', async () => {
    renderAdminApp('/admin')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders CallbackPage at the callback route', async () => {
    renderAdminApp('/admin/callback')
    expect(await screen.findByText('Callback Page')).toBeInTheDocument()
  })

  it('renders CreatorPage at the creator route', async () => {
    renderAdminApp('/admin/creator')
    expect(await screen.findByText('Creator Page')).toBeInTheDocument()
  })
})
