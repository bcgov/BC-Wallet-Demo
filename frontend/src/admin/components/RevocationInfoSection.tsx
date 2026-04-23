import type { CustomCharacter } from '../types'

import { baseUrl } from '../../client/api/BaseUrl'

interface RevocationInfoSectionProps {
  character: CustomCharacter
}

export function RevocationInfoSection({ character }: RevocationInfoSectionProps) {
  const revocationInfo = (
    character as {
      revocationInfo?: Array<{
        credentialName: string
        credentialIcon: string
        title: string
        description: string
      }>
    }
  ).revocationInfo

  if (!revocationInfo?.length) return null

  return (
    <div>
      <h4 className="text-bcgov-black font-semibold text-base mb-2">Revocation Info</h4>
      <div className="space-y-2">
        {revocationInfo.map((info, rIdx) => (
          <div
            key={rIdx}
            className="bg-white p-3 rounded border border-gray-200 text-sm flex items-start justify-between gap-3"
          >
            <div className="flex-1">
              <p className="font-medium text-bcgov-black">{info.credentialName}</p>
              <p className="text-bcgov-darkgrey font-semibold mt-1">{info.title}</p>
              <p className="text-bcgov-darkgrey text-xs mt-2 whitespace-pre-wrap">{info.description}</p>
            </div>
            {info.credentialIcon && (
              <img
                src={`${baseUrl}${info.credentialIcon}`}
                alt={info.credentialName}
                className="h-10 w-10 flex-shrink-0 object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
