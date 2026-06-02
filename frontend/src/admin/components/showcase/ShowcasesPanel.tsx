import type { Showcase } from '../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import {
  adminBaseRoute,
  deleteShowcase,
  getAllShowcases,
  getDeletedShowcases,
  permanentDeleteShowcase,
  restoreShowcase,
} from '../../api/adminApi'
import { useHasRole } from '../../hooks/useUserRole'
import { UndoToast } from '../UndoToast'

import { ShowcaseCard } from './ShowcaseCard'
import { TrashShowcaseCard } from './TrashShowcaseCard'
import { CreateOrEditShowcaseModal } from './modals/CreateOrEditShowcaseModal'
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal'

export function ShowcasesPanel() {
  const auth = useAuth()
  const navigate = useNavigate()
  const canEdit = useHasRole('creator')
  const canManageTrash = useHasRole('admin')
  // Active showcases
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Trash tab
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active')
  const [trashedShowcases, setTrashedShowcases] = useState<Showcase[]>([])
  const [trashTotal, setTrashTotal] = useState(0)
  const [trashLoading, setTrashLoading] = useState(false)
  const [trashError, setTrashError] = useState<string | null>(null)
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null)
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false)

  // Undo toast
  const [undoVisible, setUndoVisible] = useState(false)
  const [undoTarget, setUndoTarget] = useState<string | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const fetchShowcases = async () => {
    try {
      setLoading(true)
      const showcases = await getAllShowcases(auth)
      setShowcases(showcases)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch showcases')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrashedShowcases = async () => {
    try {
      setTrashLoading(true)
      const result = await getDeletedShowcases(auth)
      setTrashedShowcases(result.items)
      setTrashTotal(result.total)
      setTrashError(null)
    } catch (err) {
      setTrashError(err instanceof Error ? err.message : 'Failed to fetch deleted showcases')
    } finally {
      setTrashLoading(false)
    }
  }

  useEffect(() => {
    void fetchShowcases()
    // Fetch trash count for badge on mount
    void getDeletedShowcases(auth)
      .then((r) => setTrashTotal(r.total))
      .catch(() => undefined)
  }, [auth.user?.access_token])

  const handleDelete = async (showcaseName: string) => {
    try {
      await deleteShowcase(auth, showcaseName)
      void fetchShowcases()
      void getDeletedShowcases(auth)
        .then((r) => setTrashTotal(r.total))
        .catch(() => undefined)

      // Start 5s undo window
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      setUndoTarget(showcaseName)
      setUndoVisible(true)
      undoTimerRef.current = setTimeout(() => {
        setUndoVisible(false)
        setUndoTarget(null)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete showcase')
    }
  }

  const handleUndo = async () => {
    if (!undoTarget) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoVisible(false)
    const target = undoTarget
    setUndoTarget(null)
    try {
      await restoreShowcase(auth, target)
      void fetchShowcases()
      void getDeletedShowcases(auth)
        .then((r) => setTrashTotal(r.total))
        .catch(() => undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo deletion')
    }
  }

  const handleDismissUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoVisible(false)
    setUndoTarget(null)
  }

  const handleRestore = async (showcaseName: string) => {
    try {
      await restoreShowcase(auth, showcaseName)
      void fetchShowcases()
      void fetchTrashedShowcases()
    } catch (err) {
      setTrashError(err instanceof Error ? err.message : 'Failed to restore showcase')
    }
  }

  const handlePermanentDelete = async (showcaseName: string) => {
    if (permanentDeleteLoading) return
    try {
      setPermanentDeleteLoading(true)
      await permanentDeleteShowcase(auth, showcaseName)
      setConfirmPermanentDelete(null)
      void fetchTrashedShowcases()
    } catch (err) {
      setTrashError(err instanceof Error ? err.message : 'Failed to permanently delete showcase')
    } finally {
      setPermanentDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-bcgov-black font-semibold text-2xl">Showcases</h2>
        {canEdit && activeTab === 'active' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-bcgov-blue hover:bg-bcgov-blue-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Showcase
          </button>
        )}
      </div>

      {/* Active / Trash tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'active'
              ? 'border-bcgov-blue text-bcgov-blue'
              : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => {
            setActiveTab('trash')
            void fetchTrashedShowcases()
          }}
          className={`pb-2 px-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'trash'
              ? 'border-bcgov-blue text-bcgov-blue'
              : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
          }`}
        >
          Trash
          {trashTotal > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{trashTotal}</span>
          )}
        </button>
      </div>

      {/* Active tab content */}
      {activeTab === 'active' && (
        <>
          <p className="text-bcgov-darkgrey mb-6">Manage your digital credential showcases.</p>

          {loading && <p className="text-bcgov-darkgrey">Loading showcases...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !error && showcases.length === 0 && <p className="text-bcgov-darkgrey">No showcases found.</p>}

          {!loading && !error && showcases.length > 0 && (
            <div className="space-y-4">
              {showcases.map((showcase) => (
                <ShowcaseCard
                  key={showcase.name}
                  showcase={showcase}
                  onClick={() =>
                    navigate(`${adminBaseRoute}/creator/showcase/${showcase.name}`, { state: { showcase } })
                  }
                  onRefresh={fetchShowcases}
                  onDelete={() => void handleDelete(showcase.name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Trash tab content */}
      {activeTab === 'trash' && (
        <>
          <p className="text-bcgov-darkgrey mb-6">Deleted showcases. Restore or permanently remove them.</p>

          {trashLoading && <p className="text-bcgov-darkgrey">Loading deleted showcases...</p>}
          {trashError && <p className="text-red-600">Error: {trashError}</p>}
          {!trashLoading && !trashError && trashedShowcases.length === 0 && (
            <p className="text-bcgov-darkgrey">Trash is empty.</p>
          )}

          {!trashLoading && !trashError && trashedShowcases.length > 0 && (
            <div className="space-y-4">
              {trashedShowcases.map((showcase) => (
                <TrashShowcaseCard
                  key={showcase.name}
                  showcase={showcase}
                  onRestore={() => void handleRestore(showcase.name)}
                  onPermanentDelete={() => setConfirmPermanentDelete(showcase.name)}
                  canManage={canManageTrash}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateOrEditShowcaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(showcaseName) => {
          setIsCreateModalOpen(false)
          void fetchShowcases()
          navigate(`${adminBaseRoute}/creator/showcase/${showcaseName}`, { state: { isNewShowcase: true } })
        }}
      />

      <DeleteConfirmationModal
        isOpen={!!confirmPermanentDelete}
        title="Delete Forever"
        description="This cannot be undone. The showcase and all its assets will be permanently removed."
        onCancel={() => setConfirmPermanentDelete(null)}
        onConfirm={() => {
          if (confirmPermanentDelete) void handlePermanentDelete(confirmPermanentDelete)
        }}
      />

      <UndoToast
        visible={undoVisible}
        message="Showcase deleted"
        onUndo={() => void handleUndo()}
        onDismiss={handleDismissUndo}
      />
    </div>
  )
}
