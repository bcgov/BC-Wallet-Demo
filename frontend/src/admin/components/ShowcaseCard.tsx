import type { CustomCharacter } from '../types'

import { baseUrl } from '../../client/api/BaseUrl'

interface ShowcaseCardProps {
  character: CustomCharacter
  idx: number
  isExpanded: boolean
  onToggle: () => void
  expandedUseCase: string | null
  setExpandedUseCase: (value: string | null) => void
}

export function ShowcaseCard({ character, isExpanded, onToggle }: ShowcaseCardProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {character.image && (
              <img
                src={`${baseUrl}${character.image as string}`}
                alt={character.name as string}
                className="h-12 w-12 rounded-lg object-contain flex-shrink-0 bg-gray-100"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-bcgov-black font-semibold text-lg">{character.name as string}</h3>
                {character.hidden && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                    Hidden
                  </span>
                )}
              </div>
              <p className="text-bcgov-darkgrey">{character.type as string}</p>
            </div>
          </div>
          <div className="text-bcgov-blue font-bold text-xl flex-shrink-0">{isExpanded ? '−' : '+'}</div>
        </div>
      </button>
    </div>
  )
}
