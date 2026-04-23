import { PhotoIcon, AcademicCapIcon, Squares2X2Icon, PowerIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { baseRoute } from '../../client/api/BaseUrl'
import { ShowcasesPanel } from '../components/ShowcasesPanel'

export function CreatorPage() {
  const auth = useAuth()
  const [activeTab, setActiveTab] = useState<'showcases' | 'credentials'>('showcases')

  const handleSignOut = () => {
    void auth.signoutRedirect({
      post_logout_redirect_uri: `${window.location.origin}${baseRoute}/admin?signedOut=true`,
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-3">
            <Squares2X2Icon className="w-7 h-7 text-bcgov-blue" />
            <div className="text-xl font-semibold text-bcgov-black">Showcase Admin</div>
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('showcases')}
              className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'showcases'
                  ? 'border-bcgov-blue text-bcgov-blue'
                  : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
              }`}
            >
              <PhotoIcon className="w-5 h-5" />
              Showcases
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'credentials'
                  ? 'border-bcgov-blue text-bcgov-blue'
                  : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
              }`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              Credentials
            </button>
          </div>

          {/* Right: Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="text-bcgov-blue hover:text-bcgov-black hover:bg-gray-100 font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg"
          >
            <PowerIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start">
        {activeTab === 'showcases' && (
          <div className="w-full p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <ShowcasesPanel />
            </div>
          </div>
        )}
        {activeTab === 'credentials' && (
          <div className="w-full p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <div className="text-gray-600">Credentials tab — not yet implemented</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-bcgov-darkgrey">
        <a href="mailto:ditrust@gov.bc.ca" className="hover:underline">
          ditrust@gov.bc.ca
        </a>
        <p className="mt-2">Copyright &#169; 2026 Government of British Columbia</p>
      </div>
    </div>
  )
}
