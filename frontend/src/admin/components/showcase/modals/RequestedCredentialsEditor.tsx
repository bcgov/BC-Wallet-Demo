import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { type Showcase, type CustomRequestOptions, type CredentialRequest } from '../../../types'
import { ImageUploadModal } from '../../ImageUploadModal'

interface RequestedCredentialsEditorProps {
  requestOptions: CustomRequestOptions
  onUpdateRequestOptions: (requestOptions: CustomRequestOptions) => void
  onError: (error: string | null) => void
  showcase?: Showcase | null
  onRefresh?: () => void | Promise<void>
}

export function RequestedCredentialsEditor({
  requestOptions,
  onUpdateRequestOptions,
  onError,
  showcase,
}: RequestedCredentialsEditorProps) {
  const auth = useAuth()
  const [editingCredentialRequest, setEditingCredentialRequest] = useState<CredentialRequest | null>(null)
  const [editingCredentialRequestIdx, setEditingCredentialRequestIdx] = useState<number | null>(null)
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)

  const handleAddCredentialRequest = () => {
    setEditingCredentialRequest({
      name: '',
      icon: '',
      schema_id: '',
    })
    setEditingCredentialRequestIdx(-1)
  }

  const handleSaveCredentialRequest = () => {
    if (!editingCredentialRequest?.name.trim()) {
      onError('Credential name is required')
      return
    }

    onError(null)

    const updatedCredentials = [...(requestOptions.requestedCredentials || [])]
    if (editingCredentialRequestIdx === -1) {
      // Add new
      updatedCredentials.push(editingCredentialRequest)
    } else if (editingCredentialRequestIdx !== null) {
      // Update existing
      updatedCredentials[editingCredentialRequestIdx] = editingCredentialRequest
    }

    onUpdateRequestOptions({
      ...requestOptions,
      requestedCredentials: updatedCredentials,
    })
    setEditingCredentialRequest(null)
    setEditingCredentialRequestIdx(null)
  }

  const handleRemoveCredentialRequest = (idx: number) => {
    const updatedCredentials = requestOptions.requestedCredentials?.filter((_, i) => i !== idx) || []
    onUpdateRequestOptions({
      ...requestOptions,
      requestedCredentials: updatedCredentials,
    })
  }

  const handleEditCredentialRequest = (idx: number) => {
    if (!requestOptions?.requestedCredentials) return
    setEditingCredentialRequest({ ...requestOptions.requestedCredentials[idx] })
    setEditingCredentialRequestIdx(idx)
  }

  return (
    <div className="border-t border-gray-300 pt-4">
      <label className="block text-xs font-semibold text-bcgov-black mb-3">Requested Credentials</label>

      {editingCredentialRequest !== null ? (
        <div className="mb-3 p-3 border border-bcgov-blue rounded-lg bg-blue-50 space-y-2">
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Credential Name *</label>
            <input
              type="text"
              value={editingCredentialRequest.name}
              onChange={(e) =>
                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  name: e.target.value,
                })
              }
              placeholder="e.g., student_card"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Schema ID</label>
            <input
              type="text"
              value={editingCredentialRequest.schema_id || ''}
              onChange={(e) =>
                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  schema_id: e.target.value || undefined,
                })
              }
              placeholder="e.g., QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Credential Definition ID</label>
            <input
              type="text"
              value={editingCredentialRequest.cred_def_id || ''}
              onChange={(e) =>
                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  cred_def_id: e.target.value || undefined,
                })
              }
              placeholder="e.g., QEquAHkM35w4XVT3Ku5yat:3:CL:123:0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Icon</label>
            <div className="flex gap-2 items-center w-1/2 mx-auto">
              <button
                onClick={() => setIsImageUploadModalOpen(true)}
                className="flex-1 px-3 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
              >
                Upload Icon
              </button>
              {editingCredentialRequest.icon && (
                <div className="flex items-center gap-2 flex-1">
                  <img src={editingCredentialRequest.icon} alt="Selected icon" className="w-10 h-10 object-contain" />
                  <button
                    onClick={() =>
                      setEditingCredentialRequest({
                        ...editingCredentialRequest,
                        icon: undefined,
                      })
                    }
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Properties (comma-separated)</label>
            <input
              type="text"
              value={(editingCredentialRequest.properties || []).join(', ')}
              onChange={(e) =>
                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  properties:
                    e.target.value
                      .split(',')
                      .map((p) => p.trim())
                      .filter((p) => p.length > 0) || undefined,
                })
              }
              placeholder="e.g., student_first_name, student_last_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
            <p className="text-xs text-gray-500 mt-1">Specific attributes to request from the credential</p>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <label className="block text-xs font-semibold text-bcgov-black mb-2">Predicates (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g., expiry_date >= 20260429, age >= 18"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
            <p className="text-xs text-gray-500 mt-1"></p>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Non-Revoked To (timestamp)</label>
            <input
              type="text"
              value={editingCredentialRequest.nonRevoked?.to || ''}
              onChange={(e) => {
                const toValue = e.target.value ? parseInt(e.target.value, 10) : undefined
                const fromValue = editingCredentialRequest.nonRevoked?.from

                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  nonRevoked: toValue
                    ? { to: toValue, ...(fromValue !== undefined && { from: fromValue }) }
                    : fromValue !== undefined
                      ? { to: fromValue }
                      : undefined,
                })
              }}
              placeholder="e.g., 1672531200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bcgov-black mb-1">Non-Revoked From (timestamp)</label>
            <input
              type="text"
              value={editingCredentialRequest.nonRevoked?.from || ''}
              onChange={(e) => {
                const fromValue = e.target.value ? parseInt(e.target.value, 10) : undefined
                const toValue = editingCredentialRequest.nonRevoked?.to

                setEditingCredentialRequest({
                  ...editingCredentialRequest,
                  nonRevoked: fromValue
                    ? toValue
                      ? { to: toValue, from: fromValue }
                      : { to: fromValue }
                    : toValue
                      ? { to: toValue }
                      : undefined,
                })
              }}
              placeholder="e.g., 1640995200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveCredentialRequest}
              className="flex-1 px-3 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingCredentialRequest(null)
                setEditingCredentialRequestIdx(null)
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-bcgov-black font-medium hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        type="icon"
        onSelectImage={(imagePath) => {
          if (editingCredentialRequest && showcase && auth.user?.access_token) {
            // Update the edited credential with the new icon
            const updatedRequest = {
              ...editingCredentialRequest,
              icon: imagePath,
            }
            setEditingCredentialRequest(updatedRequest)

            // Update the requestOptions with the new credential icon
            const updatedCredentials = [...(requestOptions.requestedCredentials || [])]
            if (editingCredentialRequestIdx === -1) {
              updatedCredentials.push(updatedRequest)
            } else if (editingCredentialRequestIdx !== null) {
              updatedCredentials[editingCredentialRequestIdx] = updatedRequest
            }

            const updatedRequestOptions = {
              ...requestOptions,
              requestedCredentials: updatedCredentials,
            }

            onUpdateRequestOptions(updatedRequestOptions)
          } else if (editingCredentialRequest) {
            // Fallback: just update local state if no showcase available
            setEditingCredentialRequest({
              ...editingCredentialRequest,
              icon: imagePath,
            })
          }
        }}
      />

      {requestOptions.requestedCredentials && requestOptions.requestedCredentials.length > 0 ? (
        <div className="space-y-2 mb-3">
          {requestOptions.requestedCredentials.map((cred, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-bcgov-black">{cred.name}</p>
                {cred.schema_id && <p className="text-xs text-gray-500 truncate">{cred.schema_id}</p>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditCredentialRequest(idx)}
                  className="p-1 text-bcgov-blue hover:text-bcgov-blue-dark hover:bg-blue-50 rounded transition-colors"
                  title="Edit credential"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveCredentialRequest(idx)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Remove credential"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic mb-3">No credentials requested yet</p>
      )}

      {editingCredentialRequest === null && (
        <button
          onClick={handleAddCredentialRequest}
          className="w-full px-3 py-2 border border-bcgov-blue text-bcgov-blue font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Add Credential Request
        </button>
      )}
    </div>
  )
}
