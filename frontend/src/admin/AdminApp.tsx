import type { AuthProviderProps } from 'react-oidc-context'

import { useEffect, useState } from 'react'
import { AuthProvider } from 'react-oidc-context'
import { Route, Routes } from 'react-router-dom'

import { AuthGuard } from './auth/AuthGuard'
import { loadOidcConfig } from './auth/keycloakConfig'
import { CallbackPage } from './pages/CallbackPage'
import { CreatorPage } from './pages/CreatorPage'
import { LoginPage } from './pages/LoginPage'

const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname)
}

function AdminApp() {
  const [oidcConfig, setOidcConfig] = useState<AuthProviderProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    loadOidcConfig()
      .then(setOidcConfig)
      .catch((err: unknown) => {
        setConfigError(err instanceof Error ? err.message : 'Failed to load authentication configuration.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>

  if (configError) return <p>Authentication configuration error: {configError}</p>

  return (
    <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route path="callback" element={<CallbackPage />} />
        <Route
          path="creator"
          element={
            <AuthGuard>
              <CreatorPage />
            </AuthGuard>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default AdminApp
