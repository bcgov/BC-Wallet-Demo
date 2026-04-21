import { render, screen, waitFor } from '@testing-library/react'
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
    </MemoryRouter>,
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

  it('shows signing in message when auth has errored', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('401 Unauthorized'),
    })
    renderCallbackPage()
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('navigates to login with authError param when auth fails', async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('401 Unauthorized'),
    })
    renderCallbackPage()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('..?authError=true', { replace: true })
    })
  })
})
