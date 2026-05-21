import { ArrowUpTrayIcon, PencilIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../../../../api/adminApi'

interface EnteringNameStepProps {
  name: string
  setName: (name: string) => void
  icon?: string
  onIconUpload?: () => void
  error: string | null
  setError: (error: string | null) => void
  onContinue: () => void
  onCancel: () => void
  label: string
  placeholder: string
}

export function EnteringNameStep({
  name,
  setName,
  icon,
  onIconUpload,
  error,
  setError,
  onContinue,
  onCancel,
  label,
  placeholder,
}: EnteringNameStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-bcgov-black mb-2">{label}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {onIconUpload && (
        <div>
          <label className="block text-sm font-medium text-bcgov-black mb-2">
            Icon <span className="text-red-600">*</span>
          </label>
          <div className="relative group w-fit">
            {icon ? (
              <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                <img src={`${publicBaseUrl}${icon}`} alt="Selected icon" className="w-full h-full object-contain" />
                <PencilIcon
                  onClick={onIconUpload}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                />
              </div>
            ) : (
              <button
                onClick={onIconUpload}
                className="px-3 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Add Icon
              </button>
            )}
          </div>
          {!icon && <p className="text-red-600 text-sm mt-2">Icon is required</p>}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={!name.trim() || (onIconUpload && !icon)}
          className="px-4 py-2 text-white bg-bcgov-blue hover:bg-bcgov-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
