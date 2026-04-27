import { PhotoIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { baseRoute } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'
import { ShowcasesPanel } from '../components/showcase/ShowcasesPanel'

export function CreatorPage() {
  const [activeTab, setActiveTab] = useState<'showcases' | 'credentials'>('showcases')
  const navigate = useNavigate()

  const tabsContent = (
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
        onClick={() => navigate(`${baseRoute}/admin/creator/credentials`)}
        className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
          activeTab === 'credentials'
            ? 'border-bcgov-blue text-bcgov-blue'
            : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
        }`}
      >
        <CreditCardIcon className="w-5 h-5" />
        Credentials
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminNavbar tabsContent={tabsContent} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start">
        {activeTab === 'showcases' && (
          <div className="w-full p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <ShowcasesPanel />
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
