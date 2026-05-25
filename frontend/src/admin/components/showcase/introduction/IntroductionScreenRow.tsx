import type { IntroductionStep } from '../../../types'
import type { IntroductionRow } from '../../../utils/buildIntroductionRows'

import { publicBaseUrl } from '../../../api/adminApi'
import { useHasRole } from '../../../hooks/useUserRole'
import { ProgressIconWithTooltip } from '../ProgressIconWithTooltip'
import { ScreenRowBase } from '../ScreenRowBase'
import { AddConnectionButton } from '../buttons/AddConnectionButton'

interface IntroductionScreenRowProps {
  row: IntroductionRow
  introduction: IntroductionStep[]
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: string | number | null
  setHoverIdx: (idx: string | number | null) => void
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
  const canEdit = useHasRole('creator')

  return (
    <div>
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
          <ScreenRowBase<IntroductionStep>
            screen={screen}
            nextScreen={nextScreen}
            idx={idx}
            screensLength={introduction?.length ?? 0}
            hasChild={hasAcceptChild}
            headerContent={
              isConnectScreen && screen.issuer_name ? (
                <div className="mb-3 px-2">
                  <p className="text-sm font-semibold text-bcgov-black">{screen.issuer_name}</p>
                </div>
              ) : null
            }
            childContent={
              hasAcceptChild && nextScreen?.credentials && nextScreen.credentials.length > 0 ? (
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
              ) : null
            }
            isPredefinedScreen={
              screen.screenId === 'PICK_CHARACTER' ||
              screen.screenId === 'SETUP_COMPLETED' ||
              screen.screenId.startsWith('CONNECT')
            }
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            onEditClick={onEditClick}
            onAddScreenClick={onAddScreenClick}
            onShowDeleteConfirm={onShowDeleteConfirm}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            draggableId={`intro-screen-${idx}`}
            disableDragStart={
              !canEdit ||
              screen.screenId === 'PICK_CHARACTER' ||
              screen.screenId === 'SETUP_COMPLETED' ||
              screen.screenId.startsWith('CONNECT')
            }
            deleteTitle="Delete this connection and acceptance screens"
            hoverIdPrefix=""
            skipIconPlaceholder={true}
            showAddButton={canEdit && !screen.screenId.startsWith('ACCEPT') && !(isConnectScreen && hasAcceptChild)}
          />
        </div>
      </div>

      {/* Show "Add Connection and Issuance Screens" after CONNECT/ACCEPT pair */}
      {canEdit && isConnectScreen && hasAcceptChild && (
        <AddConnectionButton onClick={onSelectCredential} containerClassName="mt-2" />
      )}
    </div>
  )
}
