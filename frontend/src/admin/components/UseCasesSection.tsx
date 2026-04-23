import type { CustomCharacter } from '../types'

import { formatScreenId } from '../types'

interface UseCasesSectionProps {
  character: CustomCharacter
  characterIdx: number
  expandedUseCase: string | null
  setExpandedUseCase: (value: string | null) => void
}

export function UseCasesSection({
  character,
  characterIdx,
  expandedUseCase,
  setExpandedUseCase,
}: UseCasesSectionProps) {
  const useCases = (
    character as {
      useCases?: Array<{
        id: string
        name: string
        screens: Array<{ screenId: string; title: string; text?: string }>
      }>
    }
  ).useCases

  if (!useCases?.length) return null

  return (
    <div>
      <h4 className="text-bcgov-black font-semibold text-base mb-2">Use Cases</h4>
      <div className="space-y-2">
        {useCases.map((useCase, uIdx) => {
          const isExpanded = expandedUseCase === `${characterIdx}-${uIdx}`
          const toggleExpanded = () => {
            setExpandedUseCase(isExpanded ? null : `${characterIdx}-${uIdx}`)
          }
          return (
            <div key={uIdx}>
              <button
                onClick={toggleExpanded}
                className="w-full text-left bg-white p-3 rounded border border-gray-200 text-sm font-medium text-bcgov-black hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              >
                <span>{useCase.name}</span>
                <span className="text-bcgov-blue font-bold text-lg">{isExpanded ? '−' : '+'}</span>
              </button>
              {isExpanded && (
                <div className="border border-t-0 border-gray-200 rounded-b bg-gray-50 p-3 space-y-2">
                  {useCase.screens?.map((screen, scIdx) => (
                    <div key={scIdx} className="bg-white p-3 rounded border border-gray-200 text-xs space-y-1">
                      <p className="font-semibold text-bcgov-black">{formatScreenId(screen.screenId)}</p>
                      <p className="text-bcgov-darkgrey font-medium">{screen.title}</p>
                      {screen.text && <p className="text-bcgov-darkgrey whitespace-pre-wrap">{screen.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
