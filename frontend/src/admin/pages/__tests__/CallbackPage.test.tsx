import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CallbackPage } from '../CallbackPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockUseAuth = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => mockUseAuth(),
}))

const renderCallbackPage = () =>
  render(
    <MemoryRouter>
      <CallbackPage />
    </MemoryRouter>
  )

describe('CallbackPage', () => {
  it('shows signing in message while loading', () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false, error: undefined })
    renderCallbackPage()
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('shows signing in message when loaded but not yet authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, error: undefined })
    renderCallbackPage()
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('shows error message and back button when auth fails', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('401 Unauthorized'),
    })
    renderCallbackPage()
    expect(screen.getByRole('heading', { name: 'Authentication Failed' })).toBeInTheDocument()
    expect(screen.getByText('401 Unauthorized')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to Login' })).toBeInTheDocument()
  })

  it('navigates back to login when Back to Login is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('401 Unauthorized'),
    })
    renderCallbackPage()
    await userEvent.click(screen.getByRole('button', { name: 'Back to Login' }))
    expect(mockNavigate).toHaveBeenCalledWith('..', { replace: true })
  })
})
