import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isLoading) return
    if (auth.error) {
      navigate('..?authError=true', { replace: true })
    } else if (auth.isAuthenticated) {
      navigate('../creator', { replace: true })
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, navigate])

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-bcgov-darkgrey text-base">Signing in...</p>
    </div>
  )
}
