import { PowerIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { useAuth } from 'react-oidc-context'

import { adminBaseRoute } from '../api/adminApi'

interface AdminNavbarProps {
  onLogoClick?: () => void
  tabsContent?: React.ReactNode
}

export function AdminNavbar({ onLogoClick, tabsContent }: AdminNavbarProps) {
  const auth = useAuth()

  const handleSignOut = () => {
    void auth.signoutRedirect({
      post_logout_redirect_uri: `${window.location.origin}${adminBaseRoute}?signedOut=true`,
    })
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogoClick}
            className={onLogoClick ? 'text-bcgov-blue hover:text-bcgov-black transition-colors' : ''}
          >
            <Squares2X2Icon className={`w-7 h-7 ${!onLogoClick ? 'text-bcgov-blue' : ''}`} />
          </button>
          <div className="text-xl font-semibold text-bcgov-black">Showcase Admin</div>
        </div>

        {/* Center: Navigation Tabs */}
        <div>{tabsContent || <div className="hidden" />}</div>

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
  )
}
