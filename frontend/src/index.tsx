import { newTracker, enableActivityTracking, trackPageView } from '@snowplow/browser-tracker'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'

import AdminApp from './admin/AdminApp'
import ClientApp from './client/App'
import './client/index.css'
import { baseRoute } from './client/api/BaseUrl'
import * as Redux from './client/store/configureStore'
import { KBar } from './client/utils/KBar'

const { store, persistor } = Redux
newTracker('sp1', 'spt.apps.gov.bc.ca', {
  appId: 'Snowplow_standalone_DIG',
  cookieLifetime: 86400 * 548,
  platform: 'web',
  contexts: {
    webPage: true,
  },
})
enableActivityTracking({ minimumVisitLength: 15, heartbeatDelay: 30 })
trackPageView()

const container = document.getElementById('root') as HTMLElement
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={`${baseRoute}/admin/*`} element={<AdminApp />} />
        <Route
          path="/*"
          element={
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <KBar>
                  <ClientApp />
                </KBar>
              </PersistGate>
            </Provider>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
