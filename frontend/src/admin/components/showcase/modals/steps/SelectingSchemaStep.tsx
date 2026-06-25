import type { Schema } from '../../../../types'

import { CircleStackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface SelectingSchemaStepProps {
  schemas: Schema[]
  loading: boolean
  error: string | null
  onSelectSchema: (schema: Schema) => void
  onCreateNew: () => void
}

function CreateNewSchemaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
    >
      + Create New Schema
    </button>
  )
}

export function SelectingSchemaStep({
  schemas,
  loading,
  error,
  onSelectSchema,
  onCreateNew,
}: SelectingSchemaStepProps) {
  return (
    <>
      <p className="text-gray-600 mb-6">First select an existing schema or create a new schema.</p>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading schemas...</div>
      ) : schemas.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2 max-h-96 min-h-64 overflow-y-auto">
            {schemas.map((schema) => (
              <button
                key={schema.id}
                onClick={() => onSelectSchema(schema)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-bcgov-blue transition-colors flex items-start gap-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-bcgov-black">{schema.name}</p>
                  <p className="text-xs text-gray-500">v{schema.version}</p>
                  <div className="text-xs text-gray-400 mt-2 flex flex-wrap gap-1">
                    {schema.attributes.map((attr) => (
                      <span key={attr.name} className="bg-gray-100 px-2 py-1 rounded">
                        {attr.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  {schema.did.method === 'indy' && <CircleStackIcon className="h-4 w-4 text-bcgov-blue" />}
                  {schema.did.method === 'webvh' && <GlobeAltIcon className="h-4 w-4 text-bcgov-blue" />}
                  <span className="text-xs font-medium text-bcgov-blue">{schema.did.method}</span>
                </div>
              </button>
            ))}
          </div>
          <CreateNewSchemaButton onClick={onCreateNew} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">No schemas available. Create one to get started.</p>
          <CreateNewSchemaButton onClick={onCreateNew} />
        </div>
      )}
    </>
  )
}
