import { PhotoIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute } from '../api/adminApi'

interface UseCreatorTabsProps {
  activeTab: 'showcases' | 'credentials'
  onTabChange: (tab: 'showcases' | 'credentials') => void
}

export function useCreatorTabs({ activeTab, onTabChange }: UseCreatorTabsProps) {
  const navigate = useNavigate()

  const tabsContent = (
    <div className="flex gap-8">
      <button
        onClick={() => {
          onTabChange('showcases')
          navigate(`${adminBaseRoute}/creator`)
        }}
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
        onClick={() => navigate(`${adminBaseRoute}/creator/credentials`)}
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

  return tabsContent
}
