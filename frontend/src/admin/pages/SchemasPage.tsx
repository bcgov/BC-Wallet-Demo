import type { Schema } from '../types'

import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useLocation, useNavigate } from 'react-router-dom'

import { adminBaseRoute, getAvailableSchemas } from '../api/adminApi'
import { AdminNavbar } from '../components/AdminNavbar'
import { CreateSchemaModal } from '../components/schema/CreateSchemaModal'
import { SchemaCard } from '../components/schema/SchemaCard'
import { useCreatorTabs } from '../hooks/useCreatorTabs'
import { useHasRole } from '../hooks/useUserRole'

export function SchemasPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const canCreateSchemas = useHasRole('creator') || useHasRole('admin')
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'showcases' | 'schemas'>('schemas')
  const tabsContent = useCreatorTabs({ activeTab, onTabChange: setActiveTab })

  const fetchSchemas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allSchemas = await getAvailableSchemas(auth)
      setSchemas(allSchemas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchSchemas()
    }
  }, [auth.isAuthenticated])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminNavbar tabsContent={!location.state?.fromShowcase ? tabsContent : undefined} />
      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start">
        <div className="w-full p-8 flex flex-col items-center">
          <div className="w-11/12">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-bcgov-black">Schemas</h2>
                {location.state?.fromShowcase && (
                  <h5 className="text-gray-500 mt-2">Select or Create a schema for the showcase</h5>
                )}
              </div>
              {canCreateSchemas && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-bcgov-blue text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Schema
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bcgov-blue" />
                </div>
                <p className="text-gray-600 mt-4">Loading schemas...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : schemas.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <CreditCardIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-bcgov-darkgrey">No schemas found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemas.map((schema) => (
                  <button
                    key={schema.id}
                    type="button"
                    onClick={() => {
                      if (location.state?.fromShowcase && location.state?.showcaseName) {
                        navigate(`${adminBaseRoute}/creator/showcase/${location.state.showcaseName}?tab=schemas`, {
                          state: {
                            selectedSchema: schema,
                            isNewShowcase: location.state?.isNewShowcase,
                          },
                        })
                      }
                    }}
                    className="p-0 bg-transparent border-none text-left hover:shadow-lg transition-shadow focus:outline-none h-full"
                    style={{ appearance: 'none' }}
                  >
                    <SchemaCard schema={schema} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateSchemaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSchemaCreated={() => {
          setIsCreateModalOpen(false)
          fetchSchemas()
        }}
      />
    </div>
  )
}
