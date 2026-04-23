import { UserIcon, CreditCardIcon, QueueListIcon, FilmIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { baseRoute, baseUrl } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'
import { SecondaryNavbar } from '../components/SecondaryNavbar'
import { useCharacter } from '../hooks/useCharacter'

export function ShowcasePage() {
  const navigate = useNavigate()
  const { character, isLoading } = useCharacter()
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
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="font-medium">Back to Showcases</span>
        </button>
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-bcgov-black">{character?.name || 'Showcase Name'}</h2>
          <h5 className="text-gray-500 mt-2">{character?.type || 'Description of the showcase.'}</h5>
        </div>
      </div>
      {/* Secondary navbar */}
      <SecondaryNavbar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'persona' | 'introduction' | 'credentials' | 'scenarios')}
      />

      {/* Main Content */}
      {activeTab === 'persona' && (
        <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
          {/* Persona Tab */}
          <div className="w-full max-w-4xl mb-8">
            <h2 className="text-2xl font-semibold text-bcgov-black">Setup Persona</h2>
            <h5 className="text-gray-500 mt-2">Configure the details for your persona.</h5>
          </div>
          <div className="w-full max-w-4xl px-6 border border-gray-300 rounded-lg bg-white p-8">
            {/* Title Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Title</label>
              <input
                type="text"
                value={character?.name || ''}
                disabled={isLoading}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500 bg-gray-100"
              />
            </div>

            {/* Role Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-bcgov-black mb-2">Role</label>
              <input
                type="text"
                value={character?.type || ''}
                disabled={isLoading}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500 bg-gray-100"
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
        </div>
      )}
      {activeTab === 'introduction' && (
        <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
          {/* Introduction Tab */}
          <div className="w-full max-w-6xl mb-8 px-6">
            <h2 className="text-2xl font-semibold text-bcgov-black">Introduction Screens</h2>
            <h5 className="text-gray-500 mt-2">Configure the introduction screens.</h5>
          </div>
          <div className="w-full max-w-6xl px-6 space-y-6">
            {character?.onboarding?.map((screen, idx) => {
              const progressStep = character?.progressBar?.find((p) => p.onboardingStep === screen.screenId)
              return (
                <div key={idx} className="flex gap-6 items-center">
                  {/* Progress Icon */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {progressStep ? (
                      <>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-bcgov-blue bg-blue-50">
                          <img
                            src={`${baseUrl}${progressStep.iconLight}`}
                            alt={progressStep.name}
                            className="w-6 h-6"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12" />
                    )}
                  </div>

                  {/* Screen Content */}
                  <div className="flex-1 border border-gray-300 rounded-lg bg-white p-8">
                    <div className="mb-6">
                      <p className="text-sm font-bold text-bcgov-black mb-2">
                        {screen.screenId
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </p>
                      <p className="text-xs font-semibold text-bcgov-black mb-1">{screen.title}</p>
                      <p className="text-xs text-gray-600">{screen.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
