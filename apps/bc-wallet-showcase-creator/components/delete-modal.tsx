import React from 'react'

import { TriangleAlert, X } from 'lucide-react'

import ButtonOutline from './ui/button-outline'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  isLoading: boolean
  header?: string
  description?: string
  subDescription?: string
  cancelText?: string
  deleteText?: string
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  isLoading,
  header = 'Are you sure?',
  description = 'Are you sure you want to delete this item?',
  subDescription = 'This action cannot be undone.',
  cancelText = 'Cancel',
  deleteText = 'Delete',
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex flex-col justify-between bg-white dark:bg-dark-bg p-4 rounded shadow-lg w-auto max-w-[80%]">
        <div>
          <div className="flex items-center justify-between gap-6 border-b border-gray-300 dark:border-dark-border pb-4 mx-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-left">
              <TriangleAlert color={'orange'} size={22} />
              {header}
            </h3>
            <X onClick={onClose} size={22} className="cursor-pointer " />
          </div>
          <div className="py-4">
            <p
              className="mt-2 text-foreground/80 dark:text-white text-start"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            {subDescription && (
              <p
                className="text-start text-foreground dark:text-white mt-2 font-base"
                dangerouslySetInnerHTML={{ __html: subDescription }}
              />
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t pt-3 border-gray-300 dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground rounded font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <ButtonOutline onClick={onDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : deleteText}
          </ButtonOutline>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
