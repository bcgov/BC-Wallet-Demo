import { UserIcon, CreditCardIcon, QueueListIcon, FilmIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { baseRoute } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'
import { SecondaryNavbar } from '../components/SecondaryNavbar'

export function ShowcasePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'persona' | 'introduction' | 'credentials' | 'scenarios'>('persona')

  const tabs = [
    { id: 'persona', label: 'Persona', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'introduction', label: 'Introduction', icon: <QueueListIcon className="w-5 h-5" /> },
    { id: 'credentials', label: 'Credentials', icon: <CreditCardIcon className="w-5 h-5" /> },
    { id: 'scenarios', label: 'Scenarios', icon: <FilmIcon className="w-5 h-5" /> },
  ]

  const handleLogoClick = () => {
    navigate(`${baseRoute}/admin/creator`)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminNavbar onLogoClick={handleLogoClick} />

      {/* Back to Showcases Button */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <button
          onClick={() => navigate(`${baseRoute}/admin/creator`)}
          className="text-bcgov-blue hover:text-bcgov-black hover:bg-gray-100 transition-all flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <span className="font-medium">Back to Showcases</span>
        </button>
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-bcgov-black">Showcase Name</h2>
          <h5 className="text-gray-500 mt-2">Description of the showcase.</h5>
        </div>
      </div>
      {/* Secondary navbar */}
      <SecondaryNavbar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'persona' | 'introduction' | 'credentials' | 'scenarios')}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-2xl font-semibold text-bcgov-black">Setup Persona</h2>
          <h5 className="text-gray-500 mt-2">Configure the details for your persona.</h5>
        </div>
        {/* Persona Tab */}
        {activeTab === 'persona' && (
          <div className="w-full max-w-4xl px-6 border border-gray-300 rounded-lg bg-white p-8">
            {/* Title Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Title</label>
              <input
                type="text"
                defaultValue="Persona Title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500"
              />
            </div>

            {/* Role Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Role</label>
              <input
                type="text"
                defaultValue="Persona Role"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500"
              />
            </div>

            {/* Introduction Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Introduction</label>
              <textarea
                defaultValue="Persona introduction text goes here."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue resize-none text-gray-500"
                rows={4}
              />
            </div>

            {/* Image Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Image</label>
              <input
                type="text"
                defaultValue="Image URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
