import type { IntroductionStep } from '../../../types'
import type { IntroductionRow } from '../../../utils/buildIntroductionRows'

import { PlusIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../../../api/adminApi'
import { ScreenContentCard } from '../../ScreenContentCard'
import { ProgressIconWithTooltip } from '../ProgressIconWithTooltip'
import { AddConnectionButton } from '../buttons/AddConnectionButton'
import { DeleteScreenPairButton } from '../buttons/DeleteScreenPairButton'

interface IntroductionScreenRowProps {
  row: IntroductionRow
  introduction: IntroductionStep[]
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: number | null
  setHoverIdx: (idx: number | null) => void
  onEditClick: (idx: number, screen: IntroductionStep) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (connectIdx: number) => void
  onDrop: (dropIdx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onSelectCredential: () => void
}

export function IntroductionScreenRow({
  row,
  introduction,
  draggedIdx,
  dragOverIdx,
  hoverIdx,
  setHoverIdx,
  onEditClick,
  onAddScreenClick,
  onShowDeleteConfirm,
  onDrop,
  onDragStart,
  onDragOver,
  onDragLeave,
  onSelectCredential,
}: IntroductionScreenRowProps) {
  const { screen, nextScreen, progressStep, acceptProgressStep, idx } = row
  const isConnectScreen = screen.screenId.startsWith('CONNECT')
  const hasAcceptChild = !!(nextScreen && nextScreen.screenId.startsWith('ACCEPT'))

  const handleScreenDragStart = () => {
    if (screen.screenId === 'PICK_CHARACTER' || screen.screenId === 'SETUP_COMPLETED') return
    onDragStart(idx)
  }

  return (
    <div>
      <div className="mt-2">
        <div className="flex gap-6 items-center">
          {/* Progress Icons Column */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2 relative z-10">
            {/* Main Progress Icon */}
            <ProgressIconWithTooltip
              progressStep={progressStep}
              tooltipText="This icon will show in the Introduction progress bar. Edit screen to change icon."
            />

            {/* ACCEPT Progress Icon if it exists */}
            {hasAcceptChild ? (
              <ProgressIconWithTooltip
                progressStep={acceptProgressStep}
                tooltipText="This icon will show in the Introduction progress bar. Edit screen to change icon."
              />
            ) : null}
          </div>

          {/* Screens Container */}
          <div className="flex-1">
            {/* Outer container for related screens */}
            <div
              className={`${isConnectScreen && hasAcceptChild ? 'border border-gray-200 rounded-lg p-4 bg-gray-50 relative' : ''}`}
            >
              {/* Delete button for CONNECT/ACCEPT pair */}
              <DeleteScreenPairButton
                isVisible={isConnectScreen && hasAcceptChild}
                onDelete={onShowDeleteConfirm}
                index={idx}
                title="Delete this connection and acceptance screens"
              />
              {/* Issuer Label for CONNECT screens */}
              {isConnectScreen && (screen as any).issuer_name && (
                <div className="mb-3 px-2">
                  <p className="text-sm font-semibold text-bcgov-black">{(screen as any).issuer_name}</p>
                </div>
              )}
              <div className="flex gap-6 items-center">
                {/* Screen Content */}
                <ScreenContentCard
                  draggableId={`intro-screen-${idx}`}
                  screenId={screen.screenId}
                  title={screen.name}
                  text={screen.text}
                  image={screen.image}
                  containerClassName={`flex-1 border border-gray-300 rounded-lg ${isConnectScreen && hasAcceptChild ? 'bg-gray-100' : 'bg-gray-50'} p-8 flex items-center justify-between gap-6 relative`}
                  onEdit={() => onEditClick(idx, screen)}
                  isDragging={draggedIdx === idx}
                  isDragOver={dragOverIdx === idx}
                  disableDrag={
                    screen.screenId === 'PICK_CHARACTER' ||
                    screen.screenId === 'SETUP_COMPLETED' ||
                    screen.screenId.startsWith('CONNECT')
                  }
                  onDragStart={handleScreenDragStart}
                  onDragOver={(e) => onDragOver(e)}
                  onDragLeave={() => onDragLeave()}
                  onDrop={() => onDrop(idx)}
                />
              </div>

              {/* Render ACCEPT child screen if it exists */}
              {hasAcceptChild && nextScreen && (
                <div className="mt-4">
                  <div className="flex gap-6 items-center">
                    <div className="flex-1">
                      <ScreenContentCard
                        draggableId={`intro-screen-${idx + 1}`}
                        screenId={nextScreen.screenId}
                        title={nextScreen.name}
                        text={nextScreen.text}
                        image={nextScreen.image}
                        containerClassName="flex-1 border border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-between gap-6 relative"
                        onEdit={() => onEditClick(idx + 1, nextScreen)}
                        isDragging={draggedIdx === idx + 1}
                        isDragOver={dragOverIdx === idx + 1}
                        disableDrag={true}
                        onDragStart={handleScreenDragStart}
                        onDragOver={(e) => onDragOver(e)}
                        onDragLeave={() => onDragLeave()}
                        onDrop={() => onDrop(idx + 1)}
                      />
                    </div>
                  </div>
                  {/* Display credentials under ACCEPT screen */}
                  {nextScreen.credentials && nextScreen.credentials.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-xs font-semibold text-bcgov-black mb-3">Credentials</p>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {nextScreen.credentials.map((cred: any, credIdx: number) => (
                            <div
                              key={credIdx}
                              className="bg-white rounded p-4 border-l-4 border-bcgov-blue flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {cred.icon && (
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                  <img
                                    src={`${publicBaseUrl}${cred.icon}`}
                                    alt={cred.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-bcgov-black">{cred.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Show "Add Connection and Issuance Screens" after CONNECT/ACCEPT pair */}
        {isConnectScreen && hasAcceptChild && (
          <AddConnectionButton onClick={onSelectCredential} containerClassName="" />
        )}

        {/* Hover area to add new screen below (not after last screen, not for ACCEPT screens, and not after CONNECT/ACCEPT pairs) */}
        {!screen.screenId.startsWith('ACCEPT') &&
          !(isConnectScreen && hasAcceptChild) &&
          idx !== (introduction?.length ?? 0) - 1 && (
            <div
              className="flex gap-6 items-center mt-2"
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div className="flex-shrink-0 w-12" />
              <button
                onClick={() => onAddScreenClick(idx)}
                className={`flex-1 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-transparent flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-bcgov-blue transition-all duration-200 ${
                  hoverIdx === idx ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                title="Add screen"
              >
                <PlusIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Add screen</span>
              </button>
            </div>
          )}
      </div>
    </div>
  )
}
