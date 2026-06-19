import type { ScenarioScreen, Showcase, CredentialRequest, AttributeRequest } from '../../../types'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'

import { updateShowcase } from '../../../api/adminApi'

import { CreateOrEditScreenModal } from './CreateOrEditScreenModal'
import { ImageUploadModal } from './ImageUploadModal'
import { EnteringNameStep, SelectingCredentialsStep, SelectingAttributesStep, DefiningProofRequestStep } from './steps'

interface CreateConnectionAndProofScreensModalProps {
  isOpen: boolean
  onClose: () => void
  showcase?: Showcase | null
  scenarioId?: string | null
  onComplete?: () => void
}

type Step =
  | { type: 'ENTERING_VERIFIER_NAME' }
  | { type: 'EDITING_CONNECTION_SCREEN' }
  | { type: 'EDITING_PROOF_SCREEN' }
  | { type: 'SELECTING_CREDENTIALS' }
  | { type: 'SELECTING_ATTRIBUTES' }
  | { type: 'DEFINING_PROOF_REQUEST' }

export function CreateConnectionAndProofScreensModal({
  isOpen,
  onClose,
  showcase,
  scenarioId,
  onComplete,
}: CreateConnectionAndProofScreensModalProps) {
  const auth = useAuth()
  const [step, setStep] = useState<Step>({ type: 'ENTERING_VERIFIER_NAME' })
  const [verifierName, setVerifierName] = useState<string>('')
  const [verifierIcon, setVerifierIcon] = useState<string>('')
  const [connectionScreenData, setConnectionScreenData] = useState<ScenarioScreen | null>(null)
  const [proofScreenData, setProofScreenData] = useState<ScenarioScreen | null>(null)
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set())
  const [currentCredentialIdx, setCurrentCredentialIdx] = useState(0)
  const [selectedAttributes, setSelectedAttributes] = useState<Map<string, Map<string, AttributeRequest>>>(new Map())
  const [credentialRequests, setCredentialRequests] = useState<Map<string, CredentialRequest>>(new Map())
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [imageUploadModalCredentialId, setImageUploadModalCredentialId] = useState<string | null>(null)
  const [isVerifierIconUploadOpen, setIsVerifierIconUploadOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectionScreenTemplate: ScenarioScreen = {
    screenId: 'CONNECTION',
    name: 'Start verification',
    text: `Scan the QR code to start the verification process with ${verifierName}.`,
    image: '/public/common/screen/onboarding-connect-light.svg',
  }

  const proofScreenTemplate: ScenarioScreen = {
    screenId: 'PROOF',
    name: 'Confirm information to share',
    text: 'Review what information is being requested and confirm to continue.',
    image: '/public/common/screen/onboarding-credential-light.svg',
  }

  useEffect(() => {
    if (!isOpen) return

    // Reset state when modal opens
    setStep({ type: 'ENTERING_VERIFIER_NAME' })
    setVerifierName('')
    setVerifierIcon('')
    setConnectionScreenData(null)
    setProofScreenData(null)
    setSelectedCredentials(new Set())
    setCurrentCredentialIdx(0)
    setSelectedAttributes(new Map())
    setCredentialRequests(new Map())
    setIsImageUploadModalOpen(false)
    setImageUploadModalCredentialId(null)
    setIsVerifierIconUploadOpen(false)
    setError(null)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {step.type === 'ENTERING_VERIFIER_NAME' && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-bcgov-black">Enter Verifier Name</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <EnteringNameStep
                name={verifierName}
                setName={setVerifierName}
                icon={verifierIcon}
                onIconUpload={() => setIsVerifierIconUploadOpen(true)}
                error={null}
                setError={() => {}}
                onContinue={() => {
                  // Create connection screen with verifier info
                  const newConnectionScreen: ScenarioScreen = {
                    ...connectionScreenTemplate,
                    verifier: {
                      name: verifierName,
                      icon: verifierIcon,
                    },
                  }
                  setConnectionScreenData(newConnectionScreen)
                  setStep({ type: 'EDITING_CONNECTION_SCREEN' })
                }}
                onCancel={onClose}
                label="Verifier Name"
                placeholder="Enter the verifier name (e.g., Court Services)"
              />
            </div>
          </>
        )}

        {step.type === 'SELECTING_CREDENTIALS' && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep({ type: 'EDITING_PROOF_SCREEN' })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold text-bcgov-black">Verification Screens Created</h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <SelectingCredentialsStep
                showcase={showcase}
                selectedCredentials={selectedCredentials}
                onSelectCredential={(credentialId: string, checked: boolean) => {
                  const newSelected = new Set(selectedCredentials)
                  if (checked) {
                    newSelected.add(credentialId)
                  } else {
                    newSelected.delete(credentialId)
                  }
                  setSelectedCredentials(newSelected)
                }}
                onBack={() => setStep({ type: 'EDITING_PROOF_SCREEN' })}
                onContinue={async () => {
                  // If credentials are selected, go to attribute selection
                  if (selectedCredentials.size > 0) {
                    setStep({ type: 'SELECTING_ATTRIBUTES' })
                    setCurrentCredentialIdx(0)
                    return
                  }

                  // Otherwise, save both screens to scenario and close
                  if (showcase && scenarioId && connectionScreenData && proofScreenData) {
                    try {
                      // Find the scenario
                      const scenario = showcase.scenarios?.find((s) => s.id === scenarioId)
                      if (!scenario) return

                      // Find STEP_END screen index to insert before it
                      const stepEndIdx = scenario.screens?.findIndex((s) => s.screenId === 'STEP_END') ?? -1
                      const insertIdx = stepEndIdx >= 0 ? stepEndIdx : (scenario.screens?.length ?? 0)

                      // Create new screens array with CONNECTION and PROOF inserted
                      const updatedScreens = [
                        ...(scenario.screens?.slice(0, insertIdx) ?? []),
                        connectionScreenData,
                        proofScreenData,
                        ...(scenario.screens?.slice(insertIdx) ?? []),
                      ]

                      // Update the scenario with new screens
                      const updatedScenarios =
                        showcase.scenarios?.map((s) => (s.id === scenarioId ? { ...s, screens: updatedScreens } : s)) ??
                        []

                      // Update showcase with new screens
                      await updateShowcase(auth, showcase.name, {
                        scenarios: updatedScenarios,
                      })

                      // Close all modals and refresh
                      setStep({ type: 'ENTERING_VERIFIER_NAME' })
                      setVerifierName('')
                      setConnectionScreenData(null)
                      setProofScreenData(null)
                      setSelectedCredentials(new Set())

                      onComplete?.()
                      onClose()
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : 'Failed to save verification screens'
                      setError(errorMessage)
                    }
                  }
                }}
              />
            </div>
          </>
        )}
        {step.type === 'SELECTING_ATTRIBUTES' && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setStep({ type: 'SELECTING_CREDENTIALS' })
                    setCurrentCredentialIdx(0)
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold text-bcgov-black">Select Attributes</h2>
                <span className="text-sm text-gray-500">
                  ({currentCredentialIdx + 1} of {selectedCredentials.size})
                </span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <SelectingAttributesStep
                currentCredential={
                  showcase?.credentials?.find((c) => c.id === Array.from(selectedCredentials)[currentCredentialIdx]) ||
                  null
                }
                selectedAttributes={
                  selectedAttributes.get(Array.from(selectedCredentials)[currentCredentialIdx]) || new Map()
                }
                currentIndex={currentCredentialIdx}
                totalCredentials={selectedCredentials.size}
                onUpdateAttribute={(attributeName: string, request: AttributeRequest) => {
                  const credentialIds = Array.from(selectedCredentials)
                  const currentCredentialId = credentialIds[currentCredentialIdx]
                  const credentialAttrs = selectedAttributes.get(currentCredentialId) || new Map()
                  const newAttrs = new Map(credentialAttrs)
                  newAttrs.set(attributeName, request)
                  const newMap = new Map(selectedAttributes)
                  newMap.set(currentCredentialId, newAttrs)
                  setSelectedAttributes(newMap)
                }}
                onRemoveAttribute={(attributeName: string) => {
                  const credentialIds = Array.from(selectedCredentials)
                  const currentCredentialId = credentialIds[currentCredentialIdx]
                  const credentialAttrs = selectedAttributes.get(currentCredentialId) || new Map()
                  const newAttrs = new Map(credentialAttrs)
                  newAttrs.delete(attributeName)
                  const newMap = new Map(selectedAttributes)
                  if (newAttrs.size > 0) {
                    newMap.set(currentCredentialId, newAttrs)
                  } else {
                    newMap.delete(currentCredentialId)
                  }
                  setSelectedAttributes(newMap)
                }}
                onPrevious={() => setCurrentCredentialIdx(currentCredentialIdx - 1)}
                onNext={() => setCurrentCredentialIdx(currentCredentialIdx + 1)}
                onContinue={() => {
                  // Initialize credential requests for each selected credential
                  const newRequests = new Map<string, CredentialRequest>()
                  for (const credentialId of selectedCredentials) {
                    const attrs = selectedAttributes.get(credentialId)
                    const properties = attrs ? Array.from(attrs.keys()).filter((name) => attrs.get(name)?.property) : []

                    // Transform predicate configurations into Predicate objects
                    const predicates = attrs
                      ? Array.from(attrs.entries())
                          .filter(
                            ([, config]) =>
                              config.predicate &&
                              config.predicateType &&
                              config.predicateValue !== undefined &&
                              config.predicateValue !== '',
                          )
                          .map(([name, config]) => {
                            // Handle DateIntMarker format ($dateint:123)
                            if (
                              typeof config.predicateValue === 'string' &&
                              config.predicateValue.startsWith('$dateint:')
                            ) {
                              return {
                                name,
                                type: config.predicateType as string,
                                value: config.predicateValue,
                              }
                            }
                            // Try to convert to number if it looks like one
                            const numValue = Number(config.predicateValue)
                            return {
                              name,
                              type: config.predicateType as string,
                              value: isNaN(numValue) ? config.predicateValue : numValue,
                            }
                          })
                      : []

                    // Check if any attribute requires non-revoked verification
                    const hasNonRevoked = attrs ? Array.from(attrs.values()).some((config) => config.nonRevoked) : false

                    newRequests.set(credentialId, {
                      name: '',
                      schema_id: '',
                      properties,
                      predicates: predicates.length > 0 ? predicates : [],
                      nonRevoked: hasNonRevoked ? { to: '$now' } : undefined,
                    })
                  }
                  setCredentialRequests(newRequests)
                  setStep({ type: 'DEFINING_PROOF_REQUEST' })
                  setCurrentCredentialIdx(0)
                }}
              />
            </div>
          </>
        )}
        {step.type === 'DEFINING_PROOF_REQUEST' && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setStep({ type: 'SELECTING_ATTRIBUTES' })
                    setCurrentCredentialIdx(0)
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold text-bcgov-black">Define Proof Request</h2>
                <span className="text-sm text-gray-500">
                  ({currentCredentialIdx + 1} of {selectedCredentials.size})
                </span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <DefiningProofRequestStep
                currentCredential={
                  showcase?.credentials?.find((c) => c.id === Array.from(selectedCredentials)[currentCredentialIdx]) ||
                  null
                }
                currentRequest={credentialRequests.get(Array.from(selectedCredentials)[currentCredentialIdx]) || null}
                currentIndex={currentCredentialIdx}
                totalCredentials={selectedCredentials.size}
                onUploadIcon={() => {
                  setImageUploadModalCredentialId(Array.from(selectedCredentials)[currentCredentialIdx])
                  setIsImageUploadModalOpen(true)
                }}
                onPrevious={() => setCurrentCredentialIdx(currentCredentialIdx - 1)}
                onNext={() => setCurrentCredentialIdx(currentCredentialIdx + 1)}
                onFinish={async () => {
                  // Save both screens to scenario and close
                  if (showcase && scenarioId && connectionScreenData && proofScreenData) {
                    try {
                      // Find the scenario
                      const scenario = showcase.scenarios?.find((s) => s.id === scenarioId)
                      if (!scenario) return

                      // Build the requestOptions from credentialRequests
                      const proofRequests = Array.from(credentialRequests.entries()).map(([credentialId, req]) => {
                        const credential = showcase?.credentials?.find((c) => c.id === credentialId)
                        return {
                          name: credential?.name || req.name,
                          schema_id: credential?.schema_id,
                          cred_def_id: credential?.cred_def_id,
                          icon: req.icon,
                          properties: req.properties,
                          ...(req.predicates && req.predicates.length > 0 && { predicates: req.predicates }),
                          nonRevoked: req.nonRevoked,
                        }
                      })
                      const requestOptions = {
                        name: verifierName,
                        text: "Review and confirm the information you're sharing",
                        requestedCredentials: proofRequests,
                      }

                      // Update PROOF screen with requestOptions
                      const updatedProofScreen = {
                        ...proofScreenData,
                        requestOptions,
                      }

                      // Find STEP_END screen index to insert before it
                      const stepEndIdx = scenario.screens?.findIndex((s) => s.screenId === 'STEP_END') ?? -1
                      const insertIdx = stepEndIdx >= 0 ? stepEndIdx : (scenario.screens?.length ?? 0)

                      // Create new screens array with CONNECTION and PROOF inserted
                      const updatedScreens = [
                        ...(scenario.screens?.slice(0, insertIdx) ?? []),
                        connectionScreenData,
                        updatedProofScreen,
                        ...(scenario.screens?.slice(insertIdx) ?? []),
                      ]

                      // Update the scenario with new screens
                      const updatedScenarios =
                        showcase.scenarios?.map((s) => (s.id === scenarioId ? { ...s, screens: updatedScreens } : s)) ??
                        []

                      // Update showcase with new screens
                      await updateShowcase(auth, showcase.name, {
                        scenarios: updatedScenarios,
                      })

                      // Close all modals and refresh
                      setStep({ type: 'ENTERING_VERIFIER_NAME' })
                      setVerifierName('')
                      setConnectionScreenData(null)
                      setProofScreenData(null)
                      setSelectedCredentials(new Set())
                      setSelectedAttributes(new Map())
                      setCredentialRequests(new Map())
                      setCurrentCredentialIdx(0)

                      onComplete?.()
                      onClose()
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : 'Failed to save verification screens'
                      setError(errorMessage)
                    }
                  }
                }}
              />
            </div>
          </>
        )}

        {error && (
          <div className="border-t border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-800">{error}</div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 font-medium text-sm">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        type="icon"
        onSelectImage={(imagePath) => {
          if (imageUploadModalCredentialId) {
            const newRequests = new Map(credentialRequests)
            const currentRequest = newRequests.get(imageUploadModalCredentialId)
            if (currentRequest) {
              newRequests.set(imageUploadModalCredentialId, {
                ...currentRequest,
                icon: imagePath,
              })
              setCredentialRequests(newRequests)
            }
            setIsImageUploadModalOpen(false)
            setImageUploadModalCredentialId(null)
          }
        }}
      />

      <ImageUploadModal
        isOpen={isVerifierIconUploadOpen}
        onClose={() => setIsVerifierIconUploadOpen(false)}
        type="icon"
        onSelectImage={(imagePath) => {
          setVerifierIcon(imagePath)
          setIsVerifierIconUploadOpen(false)
        }}
      />

      <CreateOrEditScreenModal
        isOpen={step.type === 'EDITING_CONNECTION_SCREEN'}
        onClose={() => {
          setStep({ type: 'ENTERING_VERIFIER_NAME' })
        }}
        screen={connectionScreenData || connectionScreenTemplate}
        progressBarStep={null}
        disableScreenId={true}
        isCreate={true}
        screenType="scenarios"
        onSave={(updatedConnectionScreen) => {
          // Save CONNECTION screen and preserve verifier info, then move to PROOF screen
          setConnectionScreenData({
            ...updatedConnectionScreen,
            verifier: connectionScreenData?.verifier,
          } as ScenarioScreen)
          setStep({ type: 'EDITING_PROOF_SCREEN' })
        }}
        headerLabel="Create Connection Screen"
      />

      <CreateOrEditScreenModal
        isOpen={step.type === 'EDITING_PROOF_SCREEN'}
        onClose={() => {
          setStep({ type: 'EDITING_CONNECTION_SCREEN' })
        }}
        screen={proofScreenTemplate}
        progressBarStep={null}
        disableScreenId={true}
        isCreate={true}
        screenType="scenarios"
        onSave={async (updatedProofScreen) => {
          // Save proof screen data and show summary view
          setProofScreenData(updatedProofScreen as ScenarioScreen)
          setStep({ type: 'SELECTING_CREDENTIALS' })
        }}
        headerLabel="Create Verification Screen"
      />
    </div>
  )
}
