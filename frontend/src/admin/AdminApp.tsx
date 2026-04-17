import { AuthProvider } from 'react-oidc-context'
import { Route, Routes } from 'react-router-dom'

import { AuthGuard } from './auth/AuthGuard'
import { oidcConfig } from './auth/keycloakConfig'
import { CallbackPage } from './pages/CallbackPage'
import { CreatorPage } from './pages/CreatorPage'
import { LoginPage } from './pages/LoginPage'

const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname)
}

function AdminApp() {
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
