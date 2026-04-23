import type { CustomCharacter } from '../types'

import { baseUrl } from '../../client/api/BaseUrl'
import { formatScreenId } from '../types'

interface OnboardingSectionProps {
  character: CustomCharacter
}

export function OnboardingSection({ character }: OnboardingSectionProps) {
  const onboarding = (
    character as {
      onboarding?: Array<{ screenId: string; title: string; text?: string }>
    }
  ).onboarding

  const progressBar = (
    character as {
      progressBar?: Array<{
        name: string
        onboardingStep: string
        iconLight: string
        iconDark: string
      }>
    }
  ).progressBar

  if (!onboarding?.length) return null

  return (
    <div>
      <h4 className="text-bcgov-black font-semibold text-base mb-2">Onboarding Steps</h4>
      <div className="space-y-2">
        {onboarding.map((screen, sIdx) => {
          const progressIcon = progressBar?.find((pb) => pb.onboardingStep === screen.screenId)
          return (
            <div
              key={sIdx}
              className="bg-white p-3 rounded border border-gray-200 text-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-bcgov-black">{formatScreenId(screen.screenId as string)}</p>
                <p className="text-bcgov-darkgrey">{screen.title}</p>
                {screen.text && <p className="text-bcgov-darkgrey text-xs mt-1">{screen.text}</p>}
              </div>
              {progressIcon && (
                <img
                  src={`${baseUrl}${progressIcon.iconLight}`}
                  alt={progressIcon.name}
                  className="h-8 w-8 flex-shrink-0 object-contain"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
