import type { ScenarioScreen, Showcase } from '../types'

import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { updateShowcase } from '../api/adminApi'
import log from '../utils/logger'
import { saveScreenToShowcase } from '../utils/saveScreenToShowcase'

interface UseScenarioScreensProps {
  showcase: Showcase
  activeScenario: string | null
  onRefresh?: () => void | Promise<void>
}

export function useScenarioScreens({ showcase, activeScenario, onRefresh }: UseScenarioScreensProps) {
  const auth = useAuth()
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<ScenarioScreen | null>(null)
  const [insertionIdx, setInsertionIdx] = useState<number | null>(null)
  const [reorderedScreens, setReorderedScreens] = useState<Record<string, ScenarioScreen[]>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)
  const [togglingHiddenId, setTogglingHiddenId] = useState<string | null>(null)

  const isEditingPredefinedScreen =
    editingScreen?.screenId === 'START' ||
    editingScreen?.screenId === 'CONNECTION' ||
    editingScreen?.screenId === 'PROOF' ||
    editingScreen?.screenId === 'STEP_END'

  const closeEditModal = () => {
    setEditingScreenIdx(null)
    setEditingScreen(null)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmIdx(null)
  }

  const handleEditClick = (idx: number, screen: ScenarioScreen) => {
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
  }

  const handleAddScreenClick = (afterIdx: number) => {
    const newScreen: ScenarioScreen = {
      screenId: '',
      name: '',
      text: '',
    }
    setInsertionIdx(afterIdx + 1)
    setEditingScreenIdx(-1)
    setEditingScreen(newScreen)
  }

  const handleSaveScreen = async (updatedScreen: ScenarioScreen) => {
    if (!showcase || !activeScenario || !auth.user?.access_token) return

    try {
      const activeScreen = showcase.scenarios?.find((sc) => sc.id === activeScenario)
      if (!activeScreen) return

      const currentScreens = reorderedScreens[activeScenario] || activeScreen.screens || []

      const { updatedItems } = await saveScreenToShowcase({
        showcase,
        auth,
        updatedScreen,
        editingScreenIdx,
        insertionIdx,
        screenType: 'scenarios',
        activeScenarioId: activeScenario,
        onRefresh,
        currentItems: currentScreens,
      })

      setReorderedScreens({ ...reorderedScreens, [activeScenario]: updatedItems as ScenarioScreen[] })
      closeEditModal()
      setInsertionIdx(null)
    } catch (error) {
      log.error('Error saving screen:', error)
      throw error
    }
  }

  const handleDrop = async (draggedIdx: number, dropIdx: number) => {
    if (draggedIdx === null || !activeScenario || !showcase.scenarios) return

    const activeScenarioData = showcase.scenarios.find((sc) => sc.id === activeScenario)
    if (!activeScenarioData?.screens) return

    const currentScreens = reorderedScreens[activeScenario] || activeScenarioData.screens
    const newScreens = [...currentScreens]
    const [draggedItem] = newScreens.splice(draggedIdx, 1)
    newScreens.splice(dropIdx, 0, draggedItem)

    try {
      const updatedScenarios = showcase.scenarios.map((sc) =>
        sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
      )

      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
      await onRefresh?.()
      setReorderedScreens({})
    } catch (error) {
      log.error('Error reordering scenario screens:', error)
    }
  }

  const handleShowDeleteConfirm = (connectionIdx: number) => {
    setDeleteConfirmIdx(connectionIdx)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConnectionProofPair = async (connectionIdx: number) => {
    if (!activeScenario || !showcase.scenarios) return

    const activeScenarioData = showcase.scenarios.find((sc) => sc.id === activeScenario)
    if (!activeScenarioData?.screens) return

    const currentScreens = reorderedScreens[activeScenario] || activeScenarioData.screens
    const newScreens = currentScreens.filter((_, idx) => !(idx === connectionIdx || idx === connectionIdx + 1))

    try {
      const updatedScenarios = showcase.scenarios.map((sc) =>
        sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
      )

      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
      await onRefresh?.()
      setReorderedScreens({})
      closeDeleteConfirm()
    } catch (error) {
      log.error('Error deleting CONNECTION/PROOF pair:', error)
    }
  }

  const handleDeleteScreen = async (screenIdx: number) => {
    if (!activeScenario || !showcase.scenarios) return

    const activeScenarioData = showcase.scenarios.find((sc) => sc.id === activeScenario)
    if (!activeScenarioData) return

    const currentScreens = reorderedScreens[activeScenario] || activeScenarioData.screens || []
    const newScreens = currentScreens.filter((_, idx) => idx !== screenIdx)

    try {
      const updatedScenarios = showcase.scenarios.map((sc) =>
        sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
      )
      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
      setReorderedScreens({})
    } catch (error) {
      log.error('Error deleting screen:', error)
    }

    await onRefresh?.()
    closeEditModal()
  }

  const handleToggleHidden = async (scenarioId: string) => {
    if (!showcase.scenarios || togglingHiddenId) return
    const updatedScenarios = showcase.scenarios.map((sc) => (sc.id === scenarioId ? { ...sc, hidden: !sc.hidden } : sc))
    setTogglingHiddenId(scenarioId)
    try {
      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
      await onRefresh?.()
    } catch (error) {
      log.error('Error toggling scenario visibility:', error)
    } finally {
      setTogglingHiddenId(null)
    }
  }

  return {
    editingScreenIdx,
    editingScreen,
    insertionIdx,
    reorderedScreens,
    showDeleteConfirm,
    deleteConfirmIdx,
    isEditingPredefinedScreen,
    closeEditModal,
    closeDeleteConfirm,
    handleEditClick,
    handleAddScreenClick,
    handleSaveScreen,
    handleDrop,
    handleShowDeleteConfirm,
    handleDeleteConnectionProofPair,
    handleDeleteScreen,
    handleToggleHidden,
    togglingHiddenId,
  }
}
