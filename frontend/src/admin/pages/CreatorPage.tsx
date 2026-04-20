import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { baseUrl } from '../../client/api/BaseUrl'

const adminBase = `${baseUrl}/admin`

interface EndpointResult {
  status: number
  body: unknown
}

function useAdminFetch() {
  const auth = useAuth()

  return async (method: string, path: string, body?: unknown): Promise<EndpointResult> => {
    const res = await fetch(`${adminBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    let parsed: unknown
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
    return { status: res.status, body: parsed }
  }
}

export function CreatorPage() {
  const auth = useAuth()
  const adminFetch = useAdminFetch()
  const [result, setResult] = useState<EndpointResult | null>(null)
  const [loading, setLoading] = useState(false)

  const call = (method: string, path: string, body?: unknown) => async () => {
    setLoading(true)
    setResult(null)
    try {
      setResult(await adminFetch(method, path, body))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    void auth.signoutRedirect()
  }

  const endpoints: { label: string; method: string; path: string; body?: unknown }[] = [
    { label: 'GET /characters', method: 'GET', path: '/characters' },
    { label: 'GET /characters/test-id', method: 'GET', path: '/characters/test-id' },
    { label: 'POST /characters', method: 'POST', path: '/characters', body: { name: 'Test Character' } },
    { label: 'PUT /characters/test-id', method: 'PUT', path: '/characters/test-id', body: { name: 'Updated' } },
    { label: 'DELETE /characters/test-id', method: 'DELETE', path: '/characters/test-id' },
  ]

  return (
    <div className="container p-4 flex flex-col h-screen">
      <div className="flex flex-row my-8 md:pt-4 sm:my-4">
        <div className="flex-1" />
        <button
          className="bg-bcgov-blue text-white py-2 px-4 rounded-lg font-semibold shadow-sm select-none"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      <div className="flex flex-col flex-grow items-center justify-center gap-8">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-bcgov-black font-semibold text-3xl lg:text-4xl mb-4">Admin Portal</h1>
          {auth.user?.profile?.name && (
            <p className="text-bcgov-darkgrey text-lg mb-4">Welcome, {auth.user.profile.name}</p>
          )}
        </div>

        <div className="w-full max-w-lg border border-gray-200 rounded-lg p-4">
          <h2 className="text-bcgov-black font-semibold text-lg mb-3">API Test Panel</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {endpoints.map((ep) => (
              <button
                key={ep.label}
                disabled={loading}
                onClick={call(ep.method, ep.path, ep.body)}
                className="bg-bcgov-blue text-white text-sm py-1.5 px-3 rounded font-medium shadow-sm disabled:opacity-50 select-none"
              >
                {ep.label}
              </button>
            ))}
          </div>
          {loading && <p className="text-bcgov-darkgrey text-sm">Loading…</p>}
          {result && (
            <div className="mt-2">
              <span
                className={`inline-block text-sm font-semibold px-2 py-0.5 rounded mb-2 ${
                  result.status < 300
                    ? 'bg-green-100 text-green-800'
                    : result.status < 500
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {result.status}
              </span>
              <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(result.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="pb-4">
        <div className="flex justify-center text-bcgov-darkgrey mt-2 select-none">
          <a href="mailto:ditrust@gov.bc.ca">ditrust@gov.bc.ca</a>
        </div>
        <div className="flex justify-center select-none">
          <p className="self-center mr-2 text-sm text-bcgov-darkgrey">
            Copyright &#169; 2022 Government of British Columbia
          </p>
        </div>
      </div>
    </div>
  )
}

