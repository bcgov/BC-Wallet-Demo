import type { Credential, IntroductionStep, Showcase, ProgressBarStep, Schema } from '../../../types'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { getAvailableSchemas, updateShowcase, createCredential } from '../../../api/adminApi'
import { CreateSchemaModal } from '../../schema/CreateSchemaModal'

import { CreateOrEditScreenModal } from './CreateOrEditScreenModal'
import { EnteringNameStep, SelectingSchemaStep, DefineCredentialValuesStep } from './steps'

interface CreateConnectAndAcceptScreensModalProps {
  isOpen: boolean
  onClose: () => void
  showcase?: Showcase | null
  onComplete?: () => void
}

type Step =
  | { type: 'ENTERING_ISSUER_NAME' }
  | { type: 'SELECTING_SCHEMA' }
  | { type: 'SET_CREDENTIAL_VALUES' }
  | { type: 'EDITING_CONNECT_SCREEN' }
  | { type: 'EDITING_ACCEPT_SCREEN' }

export function CreateConnectAndAcceptScreensModal({
  isOpen,
  onClose,
  showcase,
  onComplete,
}: CreateConnectAndAcceptScreensModalProps) {
  const auth = useAuth()
  const [step, setStep] = useState<Step>({ type: 'ENTERING_ISSUER_NAME' })
  const [issuerName, setIssuerName] = useState<string>('')
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issuerNameError, setIssuerNameError] = useState<string | null>(null)
  const [isCreateSchemaModalOpen, setIsCreateSchemaModalOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null)
  const [connectScreenData, setConnectScreenData] = useState<IntroductionStep | null>(null)
  const [shouldProceedToCredentialValues, setShouldProceedToCredentialValues] = useState(false)

  const connectScreenTemplate: IntroductionStep = {
    screenId: `CONNECT_${issuerName.toUpperCase().replace(/\s+/g, '_')}`,
    name: `Connect to receive credential`,
    text: `Scan the QR code to connect and receive the ${selectedCredential?.name} credential.`,
    image: '/public/common/screen/onboarding-connect-light.svg',
    issuer_name: issuerName,
  }

  const acceptScreenTemplate: IntroductionStep = {
    screenId: `ACCEPT_${issuerName.toUpperCase().replace(/\s+/g, '_')}`,
    name: `Accept the ${selectedCredential?.name} credential`,
    text: 'Review the credential information and accept to continue.',
    image: '/public/common/screen/onboarding-credential-light.svg',
    credentials: selectedCredential ? [selectedCredential] : [],
  }

  const acceptProgressBarTemplate: ProgressBarStep = {
    name: 'Accept Credential',
    introductionStep: `ACCEPT_${issuerName.toUpperCase().replace(/\s+/g, '_')}`,
    iconLight: '/public/common/icon/icon-notification-light.svg',
    iconDark: '/public/common/icon/icon-notification-dark.svg',
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchCredentials = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getAvailableSchemas(auth)
        setSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schemas')
      } finally {
        setLoading(false)
      }
    }

    // Reset state when modal opens
    setStep({ type: 'ENTERING_ISSUER_NAME' })
    setIssuerName('')
    setSelectedCredential(null)
    setConnectScreenData(null)
    setIssuerNameError(null)

    fetchCredentials()
  }, [isOpen])

  // Auto-progress to credential values step after schema is created
  useEffect(() => {
    if (shouldProceedToCredentialValues && selectedSchema) {
      setStep({ type: 'SET_CREDENTIAL_VALUES' })
      setShouldProceedToCredentialValues(false)
    }
  }, [shouldProceedToCredentialValues, selectedSchema])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {step.type !== 'EDITING_CONNECT_SCREEN' && step.type !== 'EDITING_ACCEPT_SCREEN' && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                {(step.type === 'SET_CREDENTIAL_VALUES' || step.type === 'SELECTING_SCHEMA') && (
                  <button
                    onClick={() => {
                      if (step.type === 'SET_CREDENTIAL_VALUES') {
                        setSelectedCredential(null)
                        setStep({ type: 'SELECTING_SCHEMA' })
                      } else if (step.type === 'SELECTING_SCHEMA') {
                        setStep({ type: 'ENTERING_ISSUER_NAME' })
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ←
                  </button>
                )}
                <h2 className="text-lg font-semibold text-bcgov-black">
                  {step.type === 'ENTERING_ISSUER_NAME'
                    ? 'Enter Issuer Name'
                    : step.type === 'SET_CREDENTIAL_VALUES'
                      ? 'Credential Details'
                      : 'Create Credential'}
                </h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {step.type === 'ENTERING_ISSUER_NAME' && (
                <EnteringNameStep
                  name={issuerName}
                  setName={setIssuerName}
                  error={issuerNameError}
                  setError={setIssuerNameError}
                  onCancel={onClose}
                  onContinue={() => {
                    // Check if issuer name already exists
                    const normalizedIssuerName = issuerName.toUpperCase().replace(/\s+/g, '_')
                    const existingConnectScreen = showcase?.introduction.some(
                      (s) => s.screenId === `CONNECT_${normalizedIssuerName}`,
                    )

                    if (existingConnectScreen) {
                      setIssuerNameError(
                        `A connection screen for "${issuerName}" already exists. Please use a different issuer name.`,
                      )
                      return
                    }

                    setIssuerNameError(null)
                    setStep({ type: 'SELECTING_SCHEMA' })
                  }}
                  label="Issuer Name"
                  placeholder="Enter the issuer name"
                />
              )}

              {step.type === 'SELECTING_SCHEMA' && (
                <SelectingSchemaStep
                  schemas={schemas}
                  loading={loading}
                  error={error}
                  onSelectSchema={(schema) => {
                    setSelectedSchema(schema)
                    setStep({ type: 'SET_CREDENTIAL_VALUES' })
                  }}
                  onCreateNew={() => setIsCreateSchemaModalOpen(true)}
                />
              )}

              {step.type === 'SET_CREDENTIAL_VALUES' && (
                <DefineCredentialValuesStep
                  selectedSchema={selectedSchema}
                  error={error}
                  onBack={() => {
                    setSelectedCredential(null)
                    setStep({ type: 'SELECTING_SCHEMA' })
                    setError(null)
                  }}
                  onSelectCredential={async (values, icon) => {
                    // Create Credential object from schema and values
                    if (selectedSchema) {
                      try {
                        const credentialToCreate = {
                          name: selectedSchema.name,
                          icon,
                          version: selectedSchema.version,
                          attributes: selectedSchema.attrNames.map((attrName) => ({
                            name: attrName,
                            value: values[attrName],
                          })),
                          schema_id: selectedSchema.id,
                          cred_def_id: selectedSchema.credDefId,
                        }
                        const createdCredential = await createCredential(auth, credentialToCreate)
                        setSelectedCredential(createdCredential)
                        setError(null)
                        setStep({ type: 'EDITING_CONNECT_SCREEN' })
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to create credential')
                      }
                    }
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
      <CreateSchemaModal
        isOpen={isCreateSchemaModalOpen}
        onClose={() => setIsCreateSchemaModalOpen(false)}
        onSchemaCreated={(schema) => {
          // Set the newly created schema and flag to proceed to credential values
          setSelectedSchema(schema)
          setIsCreateSchemaModalOpen(false)
          setShouldProceedToCredentialValues(true)
          // Refresh schemas list
          const fetchSchemas = async () => {
            try {
              const data = await getAvailableSchemas(auth)
              setSchemas(data)
            } catch {
              // Silently fail - user can see the newly created schema anyway
            }
          }
          fetchSchemas()
        }}
      />
      <CreateOrEditScreenModal
        isOpen={step.type === 'EDITING_CONNECT_SCREEN'}
        onClose={() => {
          setStep({ type: 'SET_CREDENTIAL_VALUES' })
        }}
        screen={connectScreenTemplate}
        progressBarStep={null}
        isCreate={true}
        screenType="introduction"
        headerLabel="Create Connection Screen"
        onSave={(updatedConnectScreen) => {
          // Save CONNECT screen and progress bar, then open ACCEPT screen modal
          setConnectScreenData(updatedConnectScreen)
          setStep({ type: 'EDITING_ACCEPT_SCREEN' })
        }}
        disableScreenId={true}
      />
      <CreateOrEditScreenModal
        isOpen={step.type === 'EDITING_ACCEPT_SCREEN'}
        onClose={() => {
          setStep({ type: 'EDITING_CONNECT_SCREEN' })
        }}
        screen={acceptScreenTemplate}
        progressBarStep={acceptProgressBarTemplate}
        isCreate={true}
        screenType="introduction"
        headerLabel="Create Accept Issuance Screen"
        onSave={async (updatedAcceptScreen, updatedAcceptProgressBar) => {
          // Both screens are now created - add them to showcase and close everything
          if (showcase && connectScreenData) {
            // Find the SETUP_COMPLETED screen index to insert before it
            const setupCompletedIdx = showcase.introduction.findIndex((s) => s.screenId === 'SETUP_COMPLETED')
            const insertIdx = setupCompletedIdx >= 0 ? setupCompletedIdx : showcase.introduction.length

            // Create new introduction array with CONNECT and ACCEPT screens inserted
            const updatedIntroduction = [
              ...showcase.introduction.slice(0, insertIdx),
              connectScreenData,
              updatedAcceptScreen,
              ...showcase.introduction.slice(insertIdx),
            ]

            // Build updated progress bar array
            const updatedProgressBars = [...(showcase.progressBar || [])]
            if (updatedAcceptProgressBar) {
              updatedProgressBars.push(updatedAcceptProgressBar)
            }

            // Add selected credential to showcase if not already present
            const updatedCredentials = [...(showcase.credentials || [])]
            if (selectedCredential && !updatedCredentials.find((c) => c.id === selectedCredential.id)) {
              updatedCredentials.push(selectedCredential)
            }

            // Update showcase with both screens, progress bars, and credential
            await updateShowcase(auth, showcase.name, {
              introduction: updatedIntroduction,
              progressBar: updatedProgressBars,
              credentials: updatedCredentials,
            })

            // Close all modals
            setStep({ type: 'ENTERING_ISSUER_NAME' })
            setIssuerName('')
            setSelectedCredential(null)
            setConnectScreenData(null)

            // Close parent modal and refresh parent view
            onComplete?.()
            onClose()
          }
        }}
        disableScreenId={true}
      />
    </div>
  )
}
