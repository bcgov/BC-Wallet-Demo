import type { Socket } from 'socket.io-client'

import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import { baseWsUrl, socketPath } from './api/BaseUrl'
import { useAppDispatch } from './hooks/hooks'
import { useAnalytics } from './hooks/useAnalytics'
import { useConnection } from './slices/connection/connectionSelectors'
import { usePreferences } from './slices/preferences/preferencesSelectors'
import { setDarkMode } from './slices/preferences/preferencesSlice'
import { fetchLastServerReset } from './slices/preferences/preferencesThunks'
import { setMessage } from './slices/socket/socketSlice'
import { AuthProvider } from './utils/AuthContext'
import { basePath } from './utils/BasePath'
import { PrivateRoute } from './utils/PrivateRoute'
import { ThemeProvider } from './utils/ThemeContext'

const PageNotFound = lazy(() => import('./pages/PageNotFound').then(({ PageNotFound }) => ({ default: PageNotFound })))
const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage').then(({ DashboardPage }) => ({ default: DashboardPage })),
)
const IntroductionPage = lazy(() =>
  import('./pages/introduction/IntroductionPage').then(({ IntroductionPage }) => ({ default: IntroductionPage })),
)
const LandingPage = lazy(() =>
  import('./pages/landing/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })),
)
const IntroductionPreviewPage = lazy(() =>
  import('./pages/preview/IntroductionPreviewPage').then(({ IntroductionPreviewPage }) => ({
    default: IntroductionPreviewPage,
  })),
)
const ScenarioPreviewPage = lazy(() =>
  import('./pages/preview/ScenarioPreviewPage').then(({ ScenarioPreviewPage }) => ({ default: ScenarioPreviewPage })),
)
const ScenarioPage = lazy(() =>
  import('./pages/scenario/Scenario').then(({ ScenarioPage }) => ({ default: ScenarioPage })),
)

function App() {
  useAnalytics()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { connectionDate, lastServerReset } = usePreferences()
  const { id } = useConnection()
  const [socket, setSocket] = useState<Socket>()

  const localStorageTheme = localStorage.theme === 'dark'
  const windowMedia = !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches

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
    const ws = io(baseWsUrl, { path: socketPath })
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
          <Suspense fallback={null}>
            <Routes>
              {basePath !== '/' && <Route path="/" element={<Navigate to={basePath} />}></Route>}
              <Route path={`${basePath}/`} element={<LandingPage />} />
              <Route path={`${basePath}/:slug`} element={<LandingPage />} />
              <Route path={`${basePath}/demo`} element={<IntroductionPage />} />
              <Route path={`${basePath}/demo/:slug`} element={<IntroductionPage />} />
              <Route
                path={`${basePath}/dashboard`}
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path={`${basePath}/uc/:slug`}
                element={
                  <PrivateRoute>
                    <ScenarioPage />
                  </PrivateRoute>
                }
              />
              <Route path={`${basePath}/preview/introduction`} element={<IntroductionPreviewPage />} />
              <Route path={`${basePath}/preview/scenarios`} element={<ScenarioPreviewPage />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
