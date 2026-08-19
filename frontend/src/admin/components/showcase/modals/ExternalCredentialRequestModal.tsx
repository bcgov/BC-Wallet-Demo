import type { CredentialRequest } from '../../../types'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import {
  EXTERNAL_CREDENTIAL_JSON_TEMPLATE,
  buildExternalCredentialRequest,
  parseExternalCredentialJson,
} from '../../../utils/externalCredentialRequest'
import { getPublicAssetUrl } from '../../../utils/publicAssetUrl'

interface ExternalCredentialRequestModalProps {
  isOpen: boolean
  initialValue?: CredentialRequest | null
  onSave: (request: CredentialRequest) => void
  onClose: () => void
  onRequestIconUpload?: () => void
}

const fieldsFromRequest = (request?: CredentialRequest | null) =>
  request
    ? JSON.stringify(
        {
          ...(request.schema_id ? { schema_id: request.schema_id } : {}),
          ...(request.cred_def_id ? { cred_def_id: request.cred_def_id } : {}),
          ...(request.properties?.length ? { properties: request.properties } : {}),
          ...(request.predicates?.length ? { predicates: request.predicates } : {}),
          ...(request.nonRevoked ? { nonRevoked: request.nonRevoked } : {}),
        },
        null,
        2,
      )
    : EXTERNAL_CREDENTIAL_JSON_TEMPLATE

export function ExternalCredentialRequestModal({
  isOpen,
  initialValue,
  onSave,
  onClose,
  onRequestIconUpload,
}: ExternalCredentialRequestModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | undefined>()
  const [json, setJson] = useState(EXTERNAL_CREDENTIAL_JSON_TEMPLATE)
  const [touched, setTouched] = useState(false)

  const parsed = parseExternalCredentialJson(json)

  useEffect(() => {
    if (!isOpen) return
    setName(initialValue?.name || '')
    setIcon(initialValue?.icon)
    setJson(fieldsFromRequest(initialValue))
    setTouched(false)
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const save = () => {
    setTouched(true)
    if (!name.trim() || parsed.errors.length > 0 || !parsed.value) return
    onSave(buildExternalCredentialRequest(name, icon, parsed.value))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-bcgov-black">External Credential (Advanced)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Use this for a credential issued outside this showcase. The schema or credential definition must be
            available to the verifier agent on the ledger it uses.
          </div>

          <div>
            <label className="block text-sm font-medium text-bcgov-black mb-2" htmlFor="external-credential-name">
              Credential name
            </label>
            <input
              id="external-credential-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g., University Degree"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-bcgov-black mb-2">Icon</p>
            <div className="flex items-center gap-3">
              {icon ? (
                <img src={getPublicAssetUrl(icon)} alt="Credential icon" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 border border-dashed border-gray-300 rounded-lg" />
              )}
              {onRequestIconUpload && (
                <button onClick={onRequestIconUpload} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  Change icon
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-bcgov-black" htmlFor="external-credential-json">
                Credential identifiers and attributes
              </label>
              <button
                onClick={() => parsed.value && setJson(JSON.stringify(parsed.value, null, 2))}
                disabled={parsed.errors.length > 0}
                className="text-xs text-bcgov-blue disabled:text-gray-400"
              >
                Format JSON
              </button>
            </div>
            <textarea
              id="external-credential-json"
              value={json}
              onChange={(event) => {
                setJson(event.target.value)
                setTouched(true)
              }}
              rows={14}
              spellCheck={false}
              className="w-full border border-gray-300 rounded-lg p-3 font-mono text-xs"
            />
          </div>

          {(touched || parsed.errors.length > 0) && parsed.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {parsed.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {parsed.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {parsed.value && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-bcgov-black mb-2">Request preview</p>
              <p className="text-gray-600">Properties: {parsed.value.properties?.join(', ') || 'None'}</p>
              <p className="text-gray-600">
                Predicates:{' '}
                {parsed.value.predicates
                  ?.map((predicate) => `${predicate.name} ${predicate.type} ${predicate.value}`)
                  .join(', ') || 'None'}
              </p>
              {parsed.value.nonRevoked && <p className="text-green-700">Non-revoked credential required</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!name.trim() || parsed.errors.length > 0 || !parsed.value}
            className="px-4 py-2 text-white bg-bcgov-blue rounded-lg disabled:bg-gray-300"
          >
            Save credential
          </button>
        </div>
      </div>
    </div>
  )
}
