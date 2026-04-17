import { Route, Routes } from 'react-router-dom'

import { CreatorPage } from './pages/CreatorPage'
import { LoginPage } from './pages/LoginPage'

function AdminApp() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route path="creator" element={<CreatorPage />} />
    </Routes>
  )
}

export default AdminApp
