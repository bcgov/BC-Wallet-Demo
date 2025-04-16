import { useState, useEffect } from 'react'

import { CheckCircle, X } from 'lucide-react'

const Notification = ({ message, onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000) // Hide after 3 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 bg-white shadow-md rounded border border-gray-300 px-4 py-4 flex items-center gap-2 min-w-[300px]">
      <CheckCircle className="text-green-500" size={20} />
      <span className="text-gray-700 font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  )
}

export default Notification
