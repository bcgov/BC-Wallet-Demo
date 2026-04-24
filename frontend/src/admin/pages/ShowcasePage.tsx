import { UserIcon, CreditCardIcon, QueueListIcon, FilmIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { baseRoute, baseUrl } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'
import { IntroductionTab } from '../components/IntroductionTab'
import { PersonaTab } from '../components/PersonaTab'
import { SecondaryNavbar } from '../components/SecondaryNavbar'
import { useCharacter } from '../hooks/useCharacter'

export function ShowcasePage() {
  const navigate = useNavigate()
  const { character, isLoading } = useCharacter()
  const [activeTab, setActiveTab] = useState<'persona' | 'introduction' | 'credentials' | 'scenarios'>('persona')
  const [activeUseCase, setActiveUseCase] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'scenarios' && character?.useCases?.length) {
      setActiveUseCase(character.useCases[0].id)
    }
  }, [activeTab, character?.useCases])

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
      {activeTab === 'persona' && <PersonaTab character={character} isLoading={isLoading} />}
      {activeTab === 'introduction' && <IntroductionTab character={character} />}
      {activeTab === 'credentials' && (
        <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
          {/* Credentials Tab */}
          <div className="w-full max-w-6xl mb-8 px-6">
            <h2 className="text-2xl font-semibold text-bcgov-black">Credentials</h2>
            <h5 className="text-gray-500 mt-2">
              Manage credential configurations. These will be displayed in the accept credential screen.
            </h5>
          </div>
          <div className="w-full max-w-6xl px-6 space-y-6">
            {character?.onboarding
              ?.find((s) => s.screenId === 'ACCEPT_CREDENTIAL')
              ?.credentials?.map((credential, idx) => (
                <div key={idx} className="border border-gray-300 rounded-lg bg-white p-8">
                  <div className="flex items-center gap-4 mb-6">
                    {credential.icon && (
                      <img
                        src={`${baseUrl}${credential.icon}`}
                        alt={credential.name}
                        className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                      />
                    )}
                    <div>
                      <p className="text-sm font-bold text-bcgov-black">{credential.name}</p>
                      <p className="text-xs text-gray-600">v{credential.version}</p>
                    </div>
                  </div>
                  {credential.attributes && credential.attributes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-bcgov-black mb-2">Attributes</p>
                      <div className="space-y-2">
                        {credential.attributes.map((attr, attrIdx) => (
                          <div key={attrIdx} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-semibold text-bcgov-black">{attr.name}:</span>{' '}
                            <span className="text-gray-600">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
      {activeTab === 'scenarios' && (
        <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
          {/* Scenarios Tab */}
          <div className="w-full max-w-6xl mb-8 px-6">
            <h2 className="text-2xl font-semibold text-bcgov-black">Scenarios</h2>
            <h5 className="text-gray-500 mt-2">Create scenarios to walk users through credential usage.</h5>
          </div>

          {/* Inner Tabs for Use Cases */}
          <div className="w-full max-w-6xl px-6 mb-6">
            <div className="flex gap-4 border-b border-gray-200">
              {character?.useCases?.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setActiveUseCase(useCase.id)}
                  className={`py-2 px-3 font-medium transition-colors border-b-2 ${
                    activeUseCase === useCase.id
                      ? 'border-bcgov-blue-light text-bcgov-blue-light'
                      : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
                  }`}
                >
                  {useCase.name}
                </button>
              ))}
            </div>
          </div>

          {/* Use Case Content */}
          <div className="w-full max-w-6xl px-6 space-y-6">
            {character?.useCases?.map((useCase) =>
              activeUseCase === useCase.id ? (
                <div key={useCase.id}>
                  {useCase.screens?.map((screen, idx) => (
                    <div key={idx} className="border border-gray-300 rounded-lg bg-white p-8 mb-6">
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
                  ))}
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  )
}
