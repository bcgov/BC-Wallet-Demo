import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useParams, useNavigate } from 'react-router-dom'

import { baseRoute } from '../../client/api/BaseUrl'
import { AdminNavbar } from '../components/AdminNavbar'

export function ShowcasePage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()

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
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Showcases</span>
        </button>
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-bcgov-black">Showcase Name</h2>
          <h5 className="text-gray-500 mt-2">Description of the showcase.</h5>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start"></div>
    </div>
  )
}
