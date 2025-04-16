import React, { useState } from 'react'

import { Check, EllipsisVertical, Trash2 } from 'lucide-react'

interface StepHeaderCredentialProps {
  icon: React.ReactNode
  title: string
  actions?: React.ReactNode // Custom actions (buttons, menus, etc.)
  showDropdown?: boolean // Control dropdown visibility from parent
  onActionClick?: (action: 'save' | 'preview' | 'revert' | 'delete' | 'approve') => void // Callback function for actions
}

const StepHeaderCredential = ({
  icon,
  title,
  actions,
  showDropdown = true,
  onActionClick,
}: StepHeaderCredentialProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex items-center justify-between border-b border-gray-300 dark:border-dark-border pb-6 mb-6">
      {/* Left Section: Icon + Title */}
      <h2 className="text-lg font-bold flex items-center gap-2">
        <div className="p-2 mx-2 rounded highlight-text">{icon}</div>
        <div className="font-bold font-base">{title}</div>
      </h2>

      {/* Right Section: Actions or Default Dropdown */}
      <div className="relative">
        {actions
          ? actions
          : showDropdown && (
              <button onClick={() => setIsOpen(!isOpen)} className="border p-2 rounded-md">
                <EllipsisVertical size={22} />
              </button>
            )}

        {/* Default Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-light-bg dark:bg-dark-bg border rounded-md shadow-lg z-50">
            <ul className="py-1 text-sm text-light-text dark:text-dark-text">
              <li
                className="flex gap-2 px-4 mt-2 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer"
                onClick={() => {
                  onActionClick?.('delete')
                  setIsOpen(false)
                }}
              >
                <Trash2 size={20} />
                Delete
              </li>
              <li
                className="flex gap-2 px-4 mt-2 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-input-hover cursor-pointer"
                onClick={() => {
                  onActionClick?.('approve')
                }}
              >
                <Check size={20} />
                Approve
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepHeaderCredential
