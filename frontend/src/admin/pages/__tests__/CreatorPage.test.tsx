import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CreatorPage } from '../CreatorPage'

const mockSignoutRedirect = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    signoutRedirect: mockSignoutRedirect,
    user: { access_token: 'test-token', profile: { name: 'Test User' } },
  }),
}))

vi.mock('../../api/adminApi', () => ({
  adminBaseRoute: '/digital-trust/showcase/admin',
  adminBaseUrl: 'http://localhost:5000/digital-trust/showcase/admin',
  publicBaseUrl: 'http://localhost:5000/digital-trust/showcase/public',
}))

const renderCreatorPage = () =>
  render(
    <MemoryRouter>
      <CreatorPage />
    </MemoryRouter>,
  )

describe('CreatorPage', () => {
  it('renders the Admin Portal heading', () => {
    renderCreatorPage()
    expect(screen.getByRole('heading', { name: 'Showcases' })).toBeInTheDocument()
  })

  it('renders the API Test Panel', () => {
    renderCreatorPage()
    expect(screen.getByText('Manage your digital credential showcases.')).toBeInTheDocument()
  })

  it('renders all endpoint buttons', () => {
    renderCreatorPage()
    expect(screen.getByRole('button', { name: 'Create Showcase' })).toBeInTheDocument()
  })

  it('renders the contact email link', () => {
    renderCreatorPage()
    expect(screen.getByRole('link', { name: 'ditrust@gov.bc.ca' })).toBeInTheDocument()
  })

  it('renders the copyright notice', () => {
    renderCreatorPage()
    expect(screen.getByText(/Government of British Columbia/)).toBeInTheDocument()
  })

  it('renders the Sign Out button', () => {
    renderCreatorPage()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
  })

  it('calls signoutRedirect when Sign Out is clicked', async () => {
    renderCreatorPage()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    expect(mockSignoutRedirect).toHaveBeenCalled()
  })
})
