import { AddConnectionButton } from '../buttons/AddConnectionButton'

interface ScenarioSectionHeaderProps {
  screenId: string
  hasConnectionScreens: boolean
  onAddConnectionClick: () => void
}

export function ScenarioSectionHeader({
  screenId,
  hasConnectionScreens,
  onAddConnectionClick,
}: ScenarioSectionHeaderProps) {
  // CONNECTION screen header
  if (screenId === 'CONNECTION') {
    return (
      <div className="mt-4 mb-6 flex gap-6 items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
          2
        </div>
        <h3 className="text-lg font-semibold text-bcgov-black">Verify - Connection and Proof Screens</h3>
      </div>
    )
  }

  // STEP_END screen header
  if (screenId === 'STEP_END') {
    return (
      <>
        {/* Show "2" header if no CONNECTION screens exist */}
        {!hasConnectionScreens && (
          <>
            <div className="mt-4 mb-6 flex gap-6 items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
                2
              </div>
              <h3 className="text-lg font-semibold text-bcgov-black">Verify - Connection and Proof Screens</h3>
            </div>
            <div className="mb-6">
              <AddConnectionButton onClick={onAddConnectionClick} label="Add Connection and Proof Screens" />
            </div>
          </>
        )}

        {/* Success section header */}
        <div className="mt-4 mb-6 flex gap-6 items-center">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
            data-last-circle
          >
            3
          </div>
          <h3 className="text-lg font-semibold text-bcgov-black">Success</h3>
        </div>
      </>
    )
  }

  // START screen (or default "Description" header)
  if (screenId === 'START') {
    return (
      <div className="mt-4 mb-6 flex gap-6 items-center">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
          data-first-circle
        >
          1
        </div>
        <h3 className="text-lg font-semibold text-bcgov-black">Description</h3>
      </div>
    )
  }

  // Generic screens don't have section headers
  return null
}
