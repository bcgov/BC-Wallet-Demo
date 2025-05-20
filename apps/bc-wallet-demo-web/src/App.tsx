import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { demoBackendBaseWsUrl, demoBackendSocketPath } from './api/BaseUrl'
import { useAppDispatch } from './hooks/hooks'
import { useAnalytics } from './hooks/useAnalytics'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { LandingPage } from './pages/landing/LandingPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { PageNotFound } from './pages/PageNotFound'
import { UseCasePage } from './pages/useCase/UseCasePage'
import { useConnection } from './slices/connection/connectionSelectors'
import { usePreferences } from './slices/preferences/preferencesSelectors'
import { setDarkMode } from './slices/preferences/preferencesSlice'
import { fetchLastServerReset } from './slices/preferences/preferencesThunks'
import { setMessage } from './slices/socket/socketSlice'
import { AuthProvider } from './utils/AuthContext'
import { basePath } from './utils/BasePath'
import { ThemeProvider } from './utils/ThemeContext'
import { getTenantIdFromPath } from './utils/Helpers'

function App() {
  useAnalytics()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { connectionDate, lastServerReset } = usePreferences()
  const { id } = useConnection()
  const [socket, setSocket] = useState<Socket>()

  const localStorageTheme = localStorage.theme === 'dark'
  const windowMedia = !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches
  const tenantId = getTenantIdFromPath();

  useEffect(() => {
    if (localStorageTheme || windowMedia) {
      dispatch(setDarkMode(true))
    }
  }, [dispatch, localStorageTheme, windowMedia])

  useEffect(() => {
    if (connectionDate) {
      dispatch(fetchLastServerReset())
    }
  }, [connectionDate])

  useEffect(() => {
    if (connectionDate && lastServerReset) {
      if (connectionDate < lastServerReset) {
        navigate(`${basePath}/`)
        dispatch({ type: 'demo/RESET' })
      }
    }
  }, [connectionDate, lastServerReset])

  useEffect(() => {
    const ws = io(demoBackendBaseWsUrl, { path: demoBackendSocketPath })
    ws.on('connect', () => {
      setSocket(ws)
    })
    ws.on('message', (data) => {
      dispatch(setMessage(data))
    })
  }, [])
  useEffect(() => {
    if (!socket || !id) {
      return
    }
    socket.emit('subscribe', { connectionId: id })
  }, [socket, id])
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {basePath !== '/' && <Route path="/" element={<Navigate to={basePath} />}></Route>}
            <Route path={`${basePath}/${tenantId}/`} element={<LandingPage />} />
            <Route path={`${basePath}/${tenantId}/:slug`} element={<OnboardingPage />} />
            <Route path={`${basePath}/${tenantId}/:slug/:personaSlug/presentations`} element={<DashboardPage />} />
            <Route path={`${basePath}/${tenantId}/:slug/:personaSlug/presentations/:scenarioSlug`} element={<UseCasePage />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
