import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '../LoginPage'

const mockSigninRedirect = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => ({ signinRedirect: mockSigninRedirect }),
}))

vi.mock('../../../client/assets/light/landing-screen.svg', () => ({ default: 'landing-screen.svg' }))

const renderLoginPage = (url = '/') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LoginPage />
    </MemoryRouter>,
  )

describe('LoginPage', () => {
  it('renders the page heading', () => {
    renderLoginPage()
    expect(screen.getByRole('heading', { name: 'BC Wallet Showcase' })).toBeInTheDocument()
  })

  it('renders the admin portal description', () => {
    renderLoginPage()
    expect(screen.getByText('Administration portal for the BC Wallet Showcase.')).toBeInTheDocument()
  })

  it('renders the Admin Log In button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'Admin Log In' })).toBeInTheDocument()
  })

  it('renders the landing screen image', () => {
    renderLoginPage()
    expect(screen.getByAltText('bc-wallet-showcase')).toBeInTheDocument()
  })

  it('renders the contact email link', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: 'ditrust@gov.bc.ca' })).toBeInTheDocument()
  })

  it('calls signinRedirect when Admin Log In is clicked', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByRole('button', { name: 'Admin Log In' }))
    expect(mockSigninRedirect).toHaveBeenCalled()
  })

  it('does not show signed out message by default', () => {
    renderLoginPage()
    expect(screen.queryByText(/successfully signed out/)).not.toBeInTheDocument()
  })

  it('shows signed out message when signedOut query param is true', () => {
    renderLoginPage('/?signedOut=true')
    expect(screen.getByText('You have been successfully signed out.')).toBeInTheDocument()
  })

  it('does not show auth error banner by default', () => {
    renderLoginPage()
    expect(screen.queryByText(/Login authorization failed/)).not.toBeInTheDocument()
  })

  it('shows auth error banner when authError query param is true', () => {
    renderLoginPage('/?authError=true')
    expect(screen.getByText('Login authorization failed. Please try again.')).toBeInTheDocument()
  })
})
