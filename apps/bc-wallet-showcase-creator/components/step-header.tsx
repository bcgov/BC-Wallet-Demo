import React, { useState } from 'react'

import { Download, EllipsisVertical, Eye, RotateCw, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StepHeaderProps {
  icon: React.ReactNode
  title: string
  actions?: React.ReactNode // Custom actions (buttons, menus, etc.)
  showDropdown?: boolean // Control dropdown visibility from parent
  showSave?: boolean
  showPreview?: boolean
  showRevert?: boolean
  showDelete?: boolean
  onActionClick?: (action: 'save' | 'preview' | 'revert' | 'delete') => void // Callback function for actions
}

const StepHeader: React.FC<StepHeaderProps> = ({
  icon,
  title,
  actions,
  showDropdown = true,
  showSave = false,
  showPreview = false,
  showRevert = false,
  showDelete = true,
  onActionClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations()
  const hasAnyAction = showSave || showPreview || showRevert || showDelete

  return (
    <div className="flex items-center justify-between border-b border-gray-300 pb-6 mb-6">
      {/* Left Section: Icon + Title */}
      <h2 className="text-lg font-bold flex items-center gap-2">
        <div className="p-2 mx-2 rounded highlight-text">{icon}</div>
        <div className="font-bold font-base text-foreground">{title}</div>
      </h2>

      {/* Right Section: Actions or Default Dropdown */}
      <div className="relative">
        {actions
          ? actions
          : showDropdown &&
            hasAnyAction && (
              <button onClick={() => setIsOpen(!isOpen)} className="border p-2 rounded-md">
                <EllipsisVertical size={22} />
              </button>
            )}

        {/* Default Dropdown Menu */}
        {isOpen && hasAnyAction && (
          <div className="absolute right-0 mt-2 w-48 bg-light-bg dark:bg-dark-bg border rounded-md shadow-lg z-50">
            <ul className="py-1 text-sm text-foreground/80">
              {showSave && (
                <li
                  className="flex gap-2 px-4 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer"
                  onClick={() => onActionClick?.('save')}
                >
                  <Download size={20} />
                  {t('action.save_draft_header_label')}
                </li>
              )}
              {showPreview && (
                <li
                  className="flex gap-2 px-4 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer"
                  onClick={() => onActionClick?.('preview')}
                >
                  <Eye size={20} strokeWidth={3} />
                  {t('action.preview_header_label')}
                </li>
              )}
              {showRevert && (
                <li
                  className="flex gap-2 px-4 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer border-b border-light-border-secondary dark:border-dark-border"
                  onClick={() => onActionClick?.('revert')}
                >
                  <RotateCw size={20} />
                  {t('action.revert_header_label')}
                </li>
              )}
              {showDelete && (
                <li
                  className="flex gap-2 px-4 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer"
                  onClick={() => {
                    onActionClick?.('delete')
                    setIsOpen(false)
                  }}
                >
                  <Trash2 size={20} />
                  {t('action.delete_header_label')}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepHeader
