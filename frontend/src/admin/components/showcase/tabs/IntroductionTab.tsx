import type { Showcase, IntroductionStep, ProgressBarStep } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { saveScreenToShowcase } from '../../../utils/saveScreenToShowcase'
import { IntroductionInitializedModal } from '../../IntroductionInitializedModal'
import { ScreenContentCard } from '../../ScreenContentCard'
import { ProgressIconWithTooltip } from '../ProgressIconWithTooltip'
import { AddConnectionButton } from '../buttons/AddConnectionButton'
import { DeleteScreenPairButton } from '../buttons/DeleteScreenPairButton'
import { CreateConnectAndAcceptScreensModal } from '../modals/CreateConnectAndAcceptScreensModal'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal'

interface IntroductionTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
}

export function IntroductionTab({ showcase, isNewShowcase, onTabChange, onRefresh }: IntroductionTabProps) {
  const auth = useAuth()
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<IntroductionStep | null>(null)
  const [editingProgressBar, setEditingProgressBar] = useState<ProgressBarStep | null>(null)
  const [insertionIdx, setInsertionIdx] = useState<number | null>(null)
  const [reorderedIntroduction, setReorderedIntroduction] = useState<IntroductionStep[] | null>(null)
  const [showIntroductionModal, setShowIntroductionModal] = useState<boolean>(isNewShowcase ?? false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [isSelectCredentialModalOpen, setIsSelectCredentialModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)
  const [lineHeight, setLineHeight] = useState<string>('auto')
  const containerRef = useRef<HTMLDivElement>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  const isEditingPredefinedScreen =
    editingScreen?.screenId === 'PICK_CHARACTER' ||
    editingScreen?.screenId === 'SETUP_START' ||
    editingScreen?.screenId === 'SETUP_COMPLETED' ||
    editingScreen?.screenId.startsWith('CONNECT') ||
    editingScreen?.screenId.startsWith('ACCEPT')

  const handleEditClick = (idx: number, screen: IntroductionStep) => {
    const progressStep = showcase.progressBar?.find((p) => p.introductionStep === screen.screenId)
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
    setEditingProgressBar(progressStep || null)
  }

  const handleAddScreenClick = (afterIdx: number) => {
    // Create a new empty screen template
    const newScreen: IntroductionStep = {
      screenId: '',
      name: '',
      text: '',
    }
    setInsertionIdx(afterIdx + 1) // Insert after the hovered position
    setEditingScreenIdx(-1) // Indicator for new screen
    setEditingScreen(newScreen)
    setEditingProgressBar(null)
  }

  const handleSaveScreen = async (updatedScreen: IntroductionStep, updatedProgressBar?: ProgressBarStep | null) => {
    if (!showcase || !auth.user?.access_token) return

    try {
      const currentOnboarding = reorderedIntroduction || showcase.introduction || []

      const { updatedItems } = await saveScreenToShowcase({
        showcase,
        auth,
        updatedScreen,
        editingScreenIdx,
        insertionIdx,
        screenType: 'introduction',
        onRefresh,
        currentItems: currentOnboarding,
      })

      // Get the actual saved screen to ensure we use its converted screenId
      let savedScreen: IntroductionStep | undefined

      if (editingScreenIdx === -1) {
        // New screen - it's at insertionIdx
        const insertPos = insertionIdx ?? currentOnboarding.length
        savedScreen = (updatedItems as IntroductionStep[])[insertPos]
      } else if (editingScreenIdx !== null) {
        // Existing screen - it's at editingScreenIdx
        savedScreen = (updatedItems as IntroductionStep[])[editingScreenIdx]
      }

      // Handle progress bar changes (update, add, or delete)
      if (updatedProgressBar !== undefined && savedScreen?.screenId) {
        const updatedProgressBars = [...(showcase.progressBar || [])]
        const existingIndex = updatedProgressBars.findIndex((pb) => pb.introductionStep === savedScreen.screenId)

        if (updatedProgressBar === null) {
          // Delete the progress bar
          if (existingIndex !== -1) {
            updatedProgressBars.splice(existingIndex, 1)
          }
        } else {
          // Add or update the progress bar
          const progressBarWithCorrectId = {
            ...updatedProgressBar,
            introductionStep: savedScreen.screenId,
          }

          if (existingIndex !== -1) {
            // Update existing progress bar
            updatedProgressBars[existingIndex] = {
              ...updatedProgressBars[existingIndex],
              iconLight: progressBarWithCorrectId.iconLight,
              iconDark: progressBarWithCorrectId.iconDark,
            }
          } else {
            // Add new progress bar at the correct position based on screen order
            const introductionScreens = updatedItems as IntroductionStep[]
            const screenIndex = introductionScreens.findIndex(
              (screen) => screen.screenId === progressBarWithCorrectId.introductionStep,
            )

            if (screenIndex !== -1) {
              // Find the position to insert by checking other progress bars
              let insertPos = updatedProgressBars.length
              for (let i = 0; i < updatedProgressBars.length; i++) {
                const existingPbScreenIndex = introductionScreens.findIndex(
                  (screen) => screen.screenId === updatedProgressBars[i].introductionStep,
                )
                if (existingPbScreenIndex > screenIndex) {
                  insertPos = i
                  break
                }
              }
              updatedProgressBars.splice(insertPos, 0, progressBarWithCorrectId)
            } else {
              // Fallback: just push if screen not found
              updatedProgressBars.push(progressBarWithCorrectId)
            }
          }
        }

        await updateShowcase(auth, showcase.name, {
          progressBar: updatedProgressBars,
        })

        onRefresh?.()
      }

      // Update local state
      setReorderedIntroduction(updatedItems as IntroductionStep[])

      setEditingScreenIdx(null)
      setEditingScreen(null)
      setEditingProgressBar(null)
      setInsertionIdx(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving screen:', error)
    }
  }

  const handleDeleteConnectAcceptPair = async (connectIdx: number) => {
    if (!auth.user?.access_token) return
    try {
      const currentIntro = reorderedIntroduction || showcase.introduction || []
      // Remove both CONNECT (at connectIdx) and ACCEPT (at connectIdx + 1) screens
      const updatedIntro = currentIntro.filter((_, i) => i !== connectIdx && i !== connectIdx + 1)
      await updateShowcase(auth, showcase.name, { introduction: updatedIntro })
      await onRefresh?.()
      setShowDeleteConfirm(false)
      setDeleteConfirmIdx(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting CONNECT/ACCEPT pair:', error)
    }
  }

  const handleShowDeleteConfirm = (connectIdx: number) => {
    setDeleteConfirmIdx(connectIdx)
    setShowDeleteConfirm(true)
  }

  const handleDrop = async (dropIdx: number) => {
    if (draggedIdx === null || !showcase.introduction) return

    const newIntroduction = [...(reorderedIntroduction || showcase.introduction)]
    const [draggedItem] = newIntroduction.splice(draggedIdx, 1)
    newIntroduction.splice(dropIdx, 0, draggedItem)

    try {
      // Call API to persist reordered introduction
      await updateShowcase(auth, showcase.name, { introduction: newIntroduction })

      // Refresh component with backend results
      await onRefresh?.()

      // Clear local reordering state to use fresh data from backend
      setReorderedIntroduction(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reordering introduction screens:', error)
    }

    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  useEffect(() => {
    const calculateLineHeight = () => {
      if (containerRef.current) {
        // Find the first numbered circle
        const firstCircle = containerRef.current.querySelector('[data-first-circle]')
        // Find all progress icon containers and get the last one
        const allIcons = containerRef.current.querySelectorAll(
          '.flex-shrink-0.flex.flex-col.items-center.gap-2 .w-12.h-12',
        )
        const lastIcon = allIcons.length > 0 ? allIcons[allIcons.length - 1] : null

        if (firstCircle && lastIcon) {
          const container = containerRef.current
          const containerRect = container.getBoundingClientRect()
          const firstRect = firstCircle.getBoundingClientRect()
          const lastRect = lastIcon.getBoundingClientRect()

          // Calculate positions relative to container
          const topOffset = firstRect.top - containerRect.top + firstRect.height / 2
          const bottomOffset = containerRect.bottom - lastRect.bottom + lastRect.height / 2

          setLineHeight(`calc(100% - ${topOffset}px - ${bottomOffset}px)`)
        }
      }
    }

    calculateLineHeight()

    // Listen for window resize
    window.addEventListener('resize', calculateLineHeight)

    // Create ResizeObserver to watch container changes
    const resizeObserver = new ResizeObserver(calculateLineHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', calculateLineHeight)
      resizeObserver.disconnect()
    }
  }, [showcase.introduction, reorderedIntroduction])

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Introduction Tab */}
      <div className="w-4/5 px-6 mb-8">
        <h2 className="text-2xl font-semibold text-bcgov-black">Introduction Screens</h2>
        <h5 className="text-gray-500 mt-2">Configure the introduction screens.</h5>
      </div>
      <div className="w-4/5 px-6">
        <div className="bg-white rounded-lg p-4 relative" ref={containerRef}>
          {/* Vertical connecting line */}
          <div className="absolute left-10 top-8 bg-bcgov-blue z-0" style={{ height: lineHeight, width: '1px' }} />
          {(reorderedIntroduction || showcase.introduction)?.map((screen, idx) => {
            // Skip ACCEPT screens in main loop - they'll be rendered as children
            if (screen.screenId.startsWith('ACCEPT')) return null

            const progressStep = showcase.progressBar?.find((p) => p.introductionStep === screen.screenId)
            const isConnectScreen = screen.screenId.startsWith('CONNECT')
            const nextScreen = (reorderedIntroduction || showcase.introduction)?.[idx + 1]
            const hasAcceptChild = nextScreen && nextScreen.screenId.startsWith('ACCEPT')
            const acceptProgressStep = hasAcceptChild
              ? showcase.progressBar?.find((p) => p.introductionStep === nextScreen.screenId)
              : null
            const isFirstConnectScreen =
              isConnectScreen &&
              (reorderedIntroduction || showcase.introduction)?.findIndex((s) => s.screenId.startsWith('CONNECT')) ===
                idx

            const handleScreenDragStart = (idx: number) => {
              if (screen.screenId === 'PICK_CHARACTER' || screen.screenId === 'SETUP_COMPLETED') return
              handleDragStart(idx)
            }

            const issueConnectCredentialsHeader = (
              <div className="mt-4 mb-6 flex gap-6 items-start">
                <div className="w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 flex-shrink-0 relative z-10">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-bcgov-black">Issue - Connect and Issue Credentials</h3>
                  <h5 className="text-gray-500 mt-2 text-s">
                    This section covers the steps for connecting to an issuer and issuing credentials. You currently
                    can't add additional custom screens in this section.
                  </h5>
                </div>
              </div>
            )

            return (
              <div key={idx}>
                {screen.screenId === 'PICK_CHARACTER' && (
                  <div className="mt-4 mb-6 flex gap-6 items-center">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
                      data-first-circle
                    >
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-bcgov-black">Introduce Persona</h3>
                  </div>
                )}
                {screen.screenId === 'SETUP_START' && (
                  <div className="mt-4 mb-6 flex gap-6 items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-bcgov-black">Wallet and General Information</h3>
                  </div>
                )}
                {isFirstConnectScreen && issueConnectCredentialsHeader}
                {screen.screenId === 'SETUP_COMPLETED' &&
                  !(reorderedIntroduction || showcase.introduction)?.some((s) => s.screenId.startsWith('CONNECT')) && (
                    <>
                      {issueConnectCredentialsHeader}
                      <div className="mb-6">
                        <AddConnectionButton onClick={() => setIsSelectCredentialModalOpen(true)} />
                      </div>
                    </>
                  )}
                {screen.screenId === 'SETUP_COMPLETED' && (
                  <div className="mt-4 flex gap-6 items-center mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
                      4
                    </div>
                    <h3 className="text-lg font-semibold text-bcgov-black">Complete</h3>
                  </div>
                )}
                <div className="mt-2">
                  <div className="flex gap-6 items-center">
                    {/* Progress Icons Column */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 relative z-10">
                      {/* CONNECT Progress Icon */}
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
                          onDelete={handleShowDeleteConfirm}
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
                            onEdit={() => handleEditClick(idx, screen)}
                            isDragging={draggedIdx === idx}
                            isDragOver={dragOverIdx === idx}
                            disableDrag={
                              screen.screenId === 'PICK_CHARACTER' ||
                              screen.screenId === 'SETUP_COMPLETED' ||
                              screen.screenId.startsWith('CONNECT')
                            }
                            onDragStart={() => handleScreenDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(idx)}
                          />
                        </div>

                        {/* Render ACCEPT child screens if this is a CONNECT screen */}
                        {hasAcceptChild && (
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
                                  onEdit={() => handleEditClick(idx + 1, nextScreen)}
                                  isDragging={draggedIdx === idx + 1}
                                  isDragOver={dragOverIdx === idx + 1}
                                  disableDrag={true}
                                  onDragStart={() => handleScreenDragStart(idx + 1)}
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={() => handleDrop(idx + 1)}
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
                    <AddConnectionButton onClick={() => setIsSelectCredentialModalOpen(true)} containerClassName="" />
                  )}

                  {/* Hover area to add new screen below (not after last screen, not for ACCEPT screens, and not after CONNECT/ACCEPT pairs) */}
                  {!screen.screenId.startsWith('ACCEPT') &&
                    !(isConnectScreen && hasAcceptChild) &&
                    idx !== ((reorderedIntroduction || showcase.introduction)?.length ?? 0) - 1 && (
                      <div
                        className="flex gap-6 items-center mt-2"
                        onMouseEnter={() => setHoverIdx(idx)}
                        onMouseLeave={() => setHoverIdx(null)}
                      >
                        <div className="flex-shrink-0 w-12" />
                        <button
                          onClick={() => handleAddScreenClick(idx)}
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
          })}
        </div>
      </div>

      <CreateOrEditScreenModal
        isOpen={editingScreenIdx !== null}
        onClose={() => {
          setEditingScreenIdx(null)
          setEditingScreen(null)
          setEditingProgressBar(null)
        }}
        screen={editingScreen}
        progressBarStep={editingProgressBar}
        isCreate={editingScreenIdx === -1}
        screenType="introduction"
        showcaseName={showcase.name}
        auth={auth}
        disableScreenId={isEditingPredefinedScreen && editingScreenIdx !== -1}
        disableDelete={isEditingPredefinedScreen && editingScreenIdx !== -1}
        onSave={handleSaveScreen}
        onDelete={async () => {
          // Refresh after deletion
          await onRefresh?.()
          // Clear editing state
          setEditingScreenIdx(null)
          setEditingScreen(null)
          setEditingProgressBar(null)
        }}
      />
      <IntroductionInitializedModal
        isOpen={showIntroductionModal}
        onClose={() => setShowIntroductionModal(false)}
        showcaseName={showcase.name}
      />
      <CreateConnectAndAcceptScreensModal
        isOpen={isSelectCredentialModalOpen}
        onClose={() => setIsSelectCredentialModalOpen(false)}
        showcase={showcase}
        onComplete={onRefresh}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm && deleteConfirmIdx !== null}
        title="Delete Connection and Issuance Screens?"
        description="Are you sure you want to delete this connection and issuance screens? This action cannot be undone."
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteConfirmIdx(null)
        }}
        onConfirm={() => {
          if (deleteConfirmIdx !== null) {
            handleDeleteConnectAcceptPair(deleteConfirmIdx)
          }
        }}
        showIcon={false}
      />

      {isNewShowcase && (
        <div className="w-4/5 mt-8 px-6 flex justify-center">
          <button
            onClick={() => onTabChange?.('scenarios')}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Next Step
          </button>
        </div>
      )}
    </div>
  )
}
