import type { Credential } from '../types'

import { UserIcon, CreditCardIcon, QueueListIcon, FilmIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { baseRoute } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'
import { CredentialsTab } from '../components/showcase/CredentialsTab'
import { IntroductionTab } from '../components/showcase/IntroductionTab'
import { PersonaTab } from '../components/showcase/PersonaTab'
import { ScenariosTab } from '../components/showcase/ScenariosTab'
import { SecondaryNavbar } from '../components/showcase/SecondaryNavbar'
import { useCharacter } from '../hooks/useCharacter'

type TabId = 'persona' | 'introduction' | 'credentials' | 'scenarios'

export function ShowcasePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { character, isLoading, refetch } = useCharacter()
  const [isNewShowcase, setIsNewShowcase] = useState(location.state?.isNewShowcase || false)
  const [selectedCredential, setSelectedCredential] = useState<Credential | undefined>(
    location.state?.selectedCredential,
  )
  const tabFromUrl = (searchParams.get('tab') || 'persona') as TabId
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl)

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  useEffect(() => {
    if (location.state?.isNewShowcase !== undefined) {
      setIsNewShowcase(location.state.isNewShowcase)
    }
  }, [location.state?.isNewShowcase])

  useEffect(() => {
    if (location.state?.selectedCredential !== undefined) {
      setSelectedCredential(location.state.selectedCredential)
    }
  }, [location.state?.selectedCredential])

  const tabs = [
    { id: 'persona', label: 'Persona', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'credentials', label: 'Credentials', icon: <CreditCardIcon className="w-5 h-5" /> },
    { id: 'introduction', label: 'Introduction', icon: <QueueListIcon className="w-5 h-5" /> },
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
      <SecondaryNavbar tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as TabId)} />

      {/* Loading state */}
      {isLoading && !character && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bcgov-blue"></div>
            <p className="mt-4 text-gray-600">Loading showcase...</p>
          </div>
        </div>
      )}

      {/* Main Content - only show when character is loaded */}
      {character && (
        <>
          {activeTab === 'persona' && (
            <PersonaTab
              character={character}
              isLoading={isLoading}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
            />
          )}
          {activeTab === 'credentials' && (
            <CredentialsTab
              character={character}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              selectedCredential={selectedCredential}
              onRefresh={refetch}
            />
          )}
          {activeTab === 'introduction' && (
            <IntroductionTab
              character={character}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
            />
          )}
          {activeTab === 'scenarios' && <ScenariosTab character={character} isNewShowcase={isNewShowcase} onTabChange={(tab) => setActiveTab(tab as TabId)} onRefresh={refetch} />}
        </>
      )}
    </div>
  )
}
