import type { ReactNode } from 'react'

import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

import { basePath } from './BasePath'

export const PrivateRoute = (props: { children: ReactNode }) => {
  const auth = useAuth()
  return auth ? <>{props.children}</> : <Navigate to={`${basePath}/`} />
}
