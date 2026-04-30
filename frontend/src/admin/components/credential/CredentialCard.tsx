import type { Credential } from '../../types'

import { publicBaseUrl } from '../../api/adminApi'

interface CredentialCardProps {
  credential: Credential
}

export function CredentialCard({ credential }: CredentialCardProps) {
  return (
    <div className="border border-gray-300 rounded-lg bg-white p-8 h-full min-h-[320px] flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        {credential.icon && (
          <img
            src={`${publicBaseUrl}${credential.icon}`}
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
            {credential.attributes.map((attr, attrIdx) => {
              const displayValue = attr.value.length > 50 ? `${attr.value.substring(0, 50)}...` : attr.value
              return (
                <div key={attrIdx} className="text-xs bg-gray-50 p-2 rounded">
                  <span className="font-semibold text-bcgov-black">{attr.name}:</span>{' '}
                  <span className="text-gray-600">{displayValue}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
