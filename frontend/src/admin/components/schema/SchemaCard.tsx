import type { Schema } from '../../types'

import { IdentificationIcon, CircleStackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface SchemaCardProps {
  schema: Schema
}

export function SchemaCard({ schema: schema }: SchemaCardProps) {
  return (
    <div className="group border border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 p-6 h-full min-h-[320px] flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-200">
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <IdentificationIcon className="h-5 w-5 text-bcgov-blue" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-bcgov-black">{schema.name}</p>
          <p className="text-xs text-gray-500 font-medium">v{schema.version}</p>
        </div>
        <div className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
          {schema.did.method === 'indy' && <CircleStackIcon className="h-4 w-4 text-bcgov-blue" />}
          {schema.did.method === 'webvh' && <GlobeAltIcon className="h-4 w-4 text-bcgov-blue" />}
          <span className="text-xs font-medium text-bcgov-blue">{schema.did.method}</span>
        </div>
      </div>

      {schema.attributes && schema.attributes.length > 0 && (
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {schema.attributes.length} Attribute{schema.attributes.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {schema.attributes.map((attr, attrIdx) => {
              return (
                <div
                  key={attrIdx}
                  className="flex items-center justify-between gap-3 text-xs bg-white border border-gray-100 p-3 rounded-md hover:bg-blue-50 hover:border-bcgov-blue transition-colors duration-150 cursor-default"
                >
                  <span className="font-medium text-bcgov-black">{attr.name}</span>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                    {attr.type}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
