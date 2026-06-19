import type { Showcase } from '../../../types'

import { useState, useRef } from 'react'
import { useAuth } from 'react-oidc-context'

import { useDragReorder } from '../../../hooks/useDragReorder'
import { useIntroductionScreens } from '../../../hooks/useIntroductionScreens'
import { useLineHeightWithProgressIcons } from '../../../hooks/useLineHeightWithProgressIcons'
import { PreviewPanel } from '../PreviewPanel'
import { PreviewToggleButton } from '../buttons/PreviewToggleButton'
import { CreateConnectAndAcceptScreensModal } from '../modals/CreateConnectAndAcceptScreensModal'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal'
import { IntroductionInitializedModal } from '../modals/IntroductionInitializedModal'

import { IntroductionTimeline } from './IntroductionTimeline'

interface IntroductionTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

export function IntroductionTab({
  showcase,
  isNewShowcase,
  onTabChange,
  onRefresh,
  isExpanded,
  setIsExpanded,
}: IntroductionTabProps) {
  const auth = useAuth()
  const [showIntroductionModal, setShowIntroductionModal] = useState<boolean>(isNewShowcase ?? false)
  const [hoverIdx, setHoverIdx] = useState<string | number | null>(null)
  const [isSelectCredentialModalOpen, setIsSelectCredentialModalOpen] = useState(false)
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  const {
    editingScreenIdx,
    editingScreen,
    editingProgressBar,
    reorderedIntroduction,
    showDeleteConfirm,
    deleteConfirmIdx,
    isEditingPredefinedScreen,
    handleEditClick,
    handleAddScreenClick,
    handleSaveScreen,
    handleDeleteConnectAcceptPair,
    handleShowDeleteConfirm,
    handleDrop,
    closeEditModal,
    closeDeleteConfirm,
  } = useIntroductionScreens({ showcase, onRefresh })

  const lineHeight = useLineHeightWithProgressIcons(containerRef, [showcase.introduction, reorderedIntroduction])

  const handleSaveScreenWithRefresh = async (...args: Parameters<typeof handleSaveScreen>) => {
    await handleSaveScreen(...args)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleDropWithRefresh = async (dropIdx: number) => {
    await handleDrop(dropIdx, draggedIdx, setDraggedIdx, setDragOverIdx)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleDeleteWithRefresh = async (deleteIdx: number) => {
    await handleDeleteConnectAcceptPair(deleteIdx)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleAddScreenClickWithRefresh = async (...args: Parameters<typeof handleAddScreenClick>) => {
    await handleAddScreenClick(...args)
    setIframeRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex-1 overflow-auto flex gap-8 py-8 px-8">
      {/* Left Column - Content */}
      <div className="flex-1 flex flex-col items-center justify-start min-w-0">
        {/* Introduction Tab */}
        <div className="w-4/5 px-6 mb-8 flex justify-between items-start w-full">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-bcgov-black">Introduction Screens</h2>
            <h5 className="text-gray-500 mt-2">Configure the introduction screens.</h5>
          </div>
          <PreviewToggleButton isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
        </div>
        <div className="w-4/5 px-6">
          <IntroductionTimeline
            introduction={reorderedIntroduction || showcase.introduction || []}
            showcase={showcase}
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            lineHeight={lineHeight}
            containerRef={containerRef}
            onEditClick={handleEditClick}
            onAddScreenClick={handleAddScreenClickWithRefresh}
            onShowDeleteConfirm={handleShowDeleteConfirm}
            onDrop={handleDropWithRefresh}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onSelectCredential={() => setIsSelectCredentialModalOpen(true)}
            onRefresh={onRefresh}
          />
        </div>

        <CreateOrEditScreenModal
          isOpen={editingScreenIdx !== null}
          onClose={closeEditModal}
          screen={editingScreen}
          progressBarStep={editingProgressBar}
          isCreate={editingScreenIdx === -1}
          screenType="introduction"
          showcaseName={showcase.name}
          auth={auth}
          disableScreenId={isEditingPredefinedScreen && editingScreenIdx !== -1}
          disableDelete={isEditingPredefinedScreen && editingScreenIdx !== -1}
          onSave={handleSaveScreenWithRefresh}
          onDelete={async () => {
            await onRefresh?.()
            closeEditModal()
            setIframeRefreshKey((prev) => prev + 1)
          }}
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

      {/* Right Column - Preview */}
      <PreviewPanel
        isExpanded={isExpanded}
        iframeRefreshKey={iframeRefreshKey}
        showcaseName={showcase.name}
        urlPath="introduction"
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
        onCancel={closeDeleteConfirm}
        onConfirm={() => {
          if (deleteConfirmIdx !== null) {
            handleDeleteWithRefresh(deleteConfirmIdx)
          }
        }}
        showIcon={false}
      />
    </div>
  )
}
