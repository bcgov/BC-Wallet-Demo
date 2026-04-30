import { useState } from 'react'

import { AdminNavbar } from '../components/AdminNavbar'
import { ShowcasesPanel } from '../components/showcase/ShowcasesPanel'
import { useCreatorTabs } from '../hooks/useCreatorTabs'

export function CreatorPage() {
  const [activeTab, setActiveTab] = useState<'showcases' | 'credentials'>('showcases')
  const tabsContent = useCreatorTabs({ activeTab, onTabChange: setActiveTab })

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
