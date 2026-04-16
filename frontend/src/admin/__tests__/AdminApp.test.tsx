import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AdminApp from '../AdminApp'

vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}))

vi.mock('../pages/CreatorPage', () => ({
  CreatorPage: () => <div>Creator Page</div>,
}))

const renderAdminApp = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </MemoryRouter>
  )

describe('AdminApp', () => {
  it('renders LoginPage at the index route', () => {
    renderAdminApp('/admin')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders CreatorPage at the creator route', () => {
    renderAdminApp('/admin/creator')
    expect(screen.getByText('Creator Page')).toBeInTheDocument()
  })
})
