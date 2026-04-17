import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isLoading) return
    if (auth.isAuthenticated) {
      navigate('../creator', { replace: true })
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate])

  if (auth.error) {
    return (
      <div className="container p-4 flex flex-col h-screen items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-bcgov-black font-semibold text-2xl mb-4">Authentication Failed</h2>
          <p className="text-bcgov-darkgrey text-base mb-2">{auth.error.message}</p>
          <button
            className="mt-6 bg-bcgov-blue text-white py-3 px-5 rounded-lg font-semibold shadow-sm select-none"
            onClick={() => navigate('..', { replace: true })}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-bcgov-darkgrey text-base">Signing in...</p>
    </div>
  )
}
