import type { Showcase, IntroductionStep, ProgressBarStep } from '../types'

import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { updateShowcase } from '../api/adminApi'
import log from '../utils/logger'
import { saveScreenToShowcase } from '../utils/saveScreenToShowcase'
import { updateProgressBarForScreen } from '../utils/updateProgressBarForScreen'

interface UseIntroductionScreensOptions {
  showcase: Showcase
  onRefresh?: () => void | Promise<void>
}

export function useIntroductionScreens({ showcase, onRefresh }: UseIntroductionScreensOptions) {
  const auth = useAuth()
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<IntroductionStep | null>(null)
  const [editingProgressBar, setEditingProgressBar] = useState<ProgressBarStep | null>(null)
  const [insertionIdx, setInsertionIdx] = useState<number | null>(null)
  const [reorderedIntroduction, setReorderedIntroduction] = useState<IntroductionStep[] | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)

  const introductionScreens = reorderedIntroduction || showcase.introduction || []

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
    const newScreen: IntroductionStep = {
      screenId: '',
      name: '',
      text: '',
    }
    setInsertionIdx(afterIdx + 1)
    setEditingScreenIdx(-1)
    setEditingScreen(newScreen)
    setEditingProgressBar(null)
  }

  const handleSaveScreen = async (updatedScreen: IntroductionStep, updatedProgressBar?: ProgressBarStep | null) => {
    if (!showcase || !auth.user?.access_token) return

    try {
      const { updatedItems } = await saveScreenToShowcase({
        showcase,
        auth,
        updatedScreen,
        editingScreenIdx,
        insertionIdx,
        screenType: 'introduction',
        onRefresh,
        currentItems: introductionScreens,
      })

      let savedScreen: IntroductionStep | undefined

      if (editingScreenIdx === -1) {
        const insertPos = insertionIdx ?? introductionScreens.length
        savedScreen = (updatedItems as IntroductionStep[])[insertPos]
      } else if (editingScreenIdx !== null) {
        savedScreen = (updatedItems as IntroductionStep[])[editingScreenIdx]
      }

      if (updatedProgressBar !== undefined && savedScreen?.screenId) {
        const updatedProgressBars = updateProgressBarForScreen(
          showcase.progressBar || [],
          updatedProgressBar,
          savedScreen,
          updatedItems as IntroductionStep[],
        )

        await updateShowcase(auth, showcase.name, {
          progressBar: updatedProgressBars,
        })

        onRefresh?.()
      }

      setReorderedIntroduction(updatedItems as IntroductionStep[])
      setEditingScreenIdx(null)
      setEditingScreen(null)
      setEditingProgressBar(null)
      setInsertionIdx(null)
    } catch (error) {
      log.error('Error saving screen:', error)
      throw error
    }
  }

  const handleDeleteConnectAcceptPair = async (connectIdx: number) => {
    if (!auth.user?.access_token) return
    try {
      const currentIntro = introductionScreens

      const connectScreen = currentIntro[connectIdx]
      const acceptScreen = currentIntro[connectIdx + 1]
      const deletedScreenIds = [connectScreen?.screenId, acceptScreen?.screenId].filter(Boolean)

      // Collect credential IDs from deleted screens
      const credentialIdsToDelete = new Set<string>()
      if (acceptScreen?.credentials) {
        acceptScreen.credentials.forEach((cred) => credentialIdsToDelete.add(cred.id))
      }

      const updatedIntro = currentIntro.filter((_, i) => i !== connectIdx && i !== connectIdx + 1)

      const updatedProgressBar = (showcase.progressBar || []).filter(
        (entry) => !deletedScreenIds.includes(entry.introductionStep),
      )

      // Filter out deleted credentials from root showcase
      const updatedCredentials = (showcase.credentials || []).filter((cred) => !credentialIdsToDelete.has(cred.id))

      await updateShowcase(auth, showcase.name, {
        introduction: updatedIntro,
        progressBar: updatedProgressBar,
        credentials: updatedCredentials,
      })
      await onRefresh?.()
      setShowDeleteConfirm(false)
      setDeleteConfirmIdx(null)
    } catch (error) {
      log.error('Error deleting CONNECT/ACCEPT pair:', error)
    }
  }

  const handleShowDeleteConfirm = (connectIdx: number) => {
    setDeleteConfirmIdx(connectIdx)
    setShowDeleteConfirm(true)
  }

  const handleDrop = async (
    dropIdx: number,
    draggedIdx: number | null,
    setDraggedIdx: (idx: number | null) => void,
    setDragOverIdx: (idx: number | null) => void,
  ) => {
    if (draggedIdx === null || !showcase.introduction) return

    const newIntroduction = [...(introductionScreens as IntroductionStep[])]
    const [draggedItem] = newIntroduction.splice(draggedIdx, 1)
    newIntroduction.splice(dropIdx, 0, draggedItem)

    try {
      await updateShowcase(auth, showcase.name, { introduction: newIntroduction })
      await onRefresh?.()
      setReorderedIntroduction(null)
    } catch (error) {
      log.error('Error reordering introduction screens:', error)
    }

    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const closeEditModal = () => {
    setEditingScreenIdx(null)
    setEditingScreen(null)
    setEditingProgressBar(null)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmIdx(null)
  }

  return {
    // State
    editingScreenIdx,
    editingScreen,
    editingProgressBar,
    insertionIdx,
    reorderedIntroduction,
    showDeleteConfirm,
    deleteConfirmIdx,

    // Computed
    isEditingPredefinedScreen,

    // Handlers
    handleEditClick,
    handleAddScreenClick,
    handleSaveScreen,
    handleDeleteConnectAcceptPair,
    handleShowDeleteConfirm,
    handleDrop,
    closeEditModal,
    closeDeleteConfirm,
  }
}
