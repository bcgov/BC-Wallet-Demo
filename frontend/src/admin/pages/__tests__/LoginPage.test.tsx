import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '../LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../../client/assets/light/landing-screen.svg', () => ({ default: 'landing-screen.svg' }))

const renderLoginPage = () =>
  render(
    <MemoryRouter>
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

  it('navigates to creator page when Admin Log In is clicked', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByRole('button', { name: 'Admin Log In' }))
    expect(mockNavigate).toHaveBeenCalledWith('creator')
  })
})
