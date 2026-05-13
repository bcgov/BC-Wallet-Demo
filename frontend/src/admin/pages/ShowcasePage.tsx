import { UserIcon, QueueListIcon, FilmIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { adminBaseRoute } from '../api/adminApi'
import { AdminNavbar } from '../components/AdminNavbar'
import { SecondaryNavbar } from '../components/showcase/SecondaryNavbar'
import { IntroductionTab } from '../components/showcase/tabs/IntroductionTab'
import { PersonaTab } from '../components/showcase/tabs/PersonaTab'
import { ScenariosTab } from '../components/showcase/tabs/ScenariosTab'
import { useShowcase } from '../hooks/useShowcase'

type TabId = 'persona' | 'introduction' | 'scenarios'

export function ShowcasePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showcase, isLoading, refetch } = useShowcase()
  const [isNewShowcase, setIsNewShowcase] = useState(location.state?.isNewShowcase || false)
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

  const tabs = [
    { id: 'persona', label: 'Persona', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'introduction', label: 'Introduction', icon: <QueueListIcon className="w-5 h-5" /> },
    { id: 'scenarios', label: 'Scenarios', icon: <FilmIcon className="w-5 h-5" /> },
  ]

  const handleLogoClick = () => {
    navigate(`${adminBaseRoute}/creator`)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminNavbar onLogoClick={handleLogoClick} />

      {/* Back to Showcases Button */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <button
          onClick={() => navigate(`${adminBaseRoute}/creator`)}
          className="text-bcgov-blue hover:text-bcgov-black hover:bg-gray-100 transition-all flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="font-medium">Back to Showcases</span>
        </button>
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-bcgov-black">{showcase?.name || 'Showcase Name'}</h2>
          <h5 className="text-gray-500 mt-2">{showcase?.description || 'Description of the showcase.'}</h5>
        </div>
      </div>
      {/* Secondary navbar */}
      <SecondaryNavbar tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as TabId)} />

      {/* Loading state */}
      {isLoading && !showcase && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bcgov-blue"></div>
            <p className="mt-4 text-gray-600">Loading showcase...</p>
          </div>
        </div>
      )}

      {/* Main Content - only show when showcase is loaded */}
      {showcase && (
        <>
          {activeTab === 'persona' && (
            <PersonaTab
              showcase={showcase}
              isLoading={isLoading}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              onRefresh={refetch}
            />
          )}
          {activeTab === 'introduction' && (
            <IntroductionTab
              showcase={showcase}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              onRefresh={refetch}
            />
          )}
          {activeTab === 'scenarios' && (
            <ScenariosTab
              showcase={showcase}
              isNewShowcase={isNewShowcase}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              onRefresh={refetch}
            />
          )}
        </>
      )}
    </div>
  )
}
