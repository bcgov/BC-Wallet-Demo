import type { Showcase } from '../../types'

interface ShowcaseCardProps {
  showcase: Showcase
  onClick: () => void
}

export function ShowcaseCard({ showcase, onClick }: ShowcaseCardProps) {
  return (
    <div>
      <button
        onClick={onClick}
        className="w-full text-left border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-bcgov-black font-semibold text-lg">{showcase.name as string}</h3>
              {showcase.status === 'hidden' && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-bcgov-darkgrey">{showcase.description as string}</p>
          </div>
        </div>
      </button>
    </div>
  )
}
