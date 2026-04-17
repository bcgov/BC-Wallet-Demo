import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { CreatorPage } from '../CreatorPage'

const renderCreatorPage = () =>
  render(
    <MemoryRouter>
      <CreatorPage />
    </MemoryRouter>,
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
})
