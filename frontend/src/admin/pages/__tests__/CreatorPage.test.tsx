import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CreatorPage } from '../CreatorPage'

const mockSignoutRedirect = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => ({ signoutRedirect: mockSignoutRedirect }),
}))

vi.mock('../../../client/api/BaseUrl', () => ({ baseRoute: '/digital-trust/showcase' }))

const renderCreatorPage = () =>
  render(
    <MemoryRouter>
      <CreatorPage />
    </MemoryRouter>
  )

describe('CreatorPage', () => {
  it('renders the Admin Portal heading', () => {
    renderCreatorPage()
    expect(screen.getByRole('heading', { name: 'Admin Portal' })).toBeInTheDocument()
  })

  it('renders the placeholder message', () => {
    renderCreatorPage()
    expect(screen.getByText('Admin dashboard coming soon.')).toBeInTheDocument()
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
    expect(mockSignoutRedirect).toHaveBeenCalledWith({
      post_logout_redirect_uri: expect.stringContaining('?signedOut=true'),
    })
  })
})
