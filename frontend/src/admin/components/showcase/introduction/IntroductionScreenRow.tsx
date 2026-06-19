import type { IntroductionStep, Schema } from '../../../types'
import type { IntroductionRow } from '../../../utils/buildIntroductionRows'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { getSchemaById, publicBaseUrl, updateCredential } from '../../../api/adminApi'
import { useHasRole } from '../../../hooks/useUserRole'
import { formatPredicateValue, truncateLongString } from '../../../utils/formatters'
import logger from '../../../utils/logger'
import { ProgressIconWithTooltip } from '../ProgressIconWithTooltip'
import { ScreenRowBase } from '../ScreenRowBase'
import { AddConnectionButton } from '../buttons/AddConnectionButton'
import { DefineCredentialValuesStep } from '../modals/steps/DefineCredentialValuesStep'

interface IntroductionScreenRowProps {
  row: IntroductionRow
  introduction: IntroductionStep[]
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: string | number | null
  setHoverIdx: (idx: string | number | null) => void
  onEditClick: (idx: number, screen: IntroductionStep) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (connectIdx: number) => void
  onDrop: (dropIdx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onSelectCredential: () => void
  onRefresh?: () => Promise<void>
}

export function IntroductionScreenRow({
  row,
  introduction,
  draggedIdx,
  dragOverIdx,
  hoverIdx,
  setHoverIdx,
  onEditClick,
  onAddScreenClick,
  onShowDeleteConfirm,
  onDrop,
  onDragStart,
  onDragOver,
  onDragLeave,
  onSelectCredential,
  onRefresh,
}: IntroductionScreenRowProps) {
  const auth = useAuth()
  const [editingCredentialIdx, setEditingCredentialIdx] = useState<number | null>(null)
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null)
  const { screen, nextScreen, progressStep, acceptProgressStep, idx } = row
  const isConnectScreen = screen.screenId.startsWith('CONNECT')
  const hasAcceptChild = !!(nextScreen && nextScreen.screenId.startsWith('ACCEPT'))
  const canEdit = useHasRole('creator')

  useEffect(() => {
    const fetchSchema = async () => {
      if (editingCredentialIdx !== null && nextScreen?.credentials?.[editingCredentialIdx] && auth.isAuthenticated) {
        const credential = nextScreen.credentials[editingCredentialIdx]
        if (!credential.schema_id) {
          setSelectedSchema(null)
          return
        }
        const schema = await getSchemaById(auth, credential.schema_id)
        setSelectedSchema(schema)
      }
    }
    fetchSchema()
  }, [editingCredentialIdx, auth.isAuthenticated, nextScreen])

  return (
    <div>
      <div className="flex gap-6 items-center">
        {/* Progress Icons Column */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 relative z-10">
          {/* Main Progress Icon */}
          <ProgressIconWithTooltip
            progressStep={progressStep}
            tooltipText="This icon will show in the Introduction progress bar. Edit screen to change icon."
          />

          {/* ACCEPT Progress Icon if it exists */}
          {hasAcceptChild ? (
            <ProgressIconWithTooltip
              progressStep={acceptProgressStep}
              tooltipText="This icon will show in the Introduction progress bar. Edit screen to change icon."
            />
          ) : null}
        </div>

        {/* Screens Container */}
        <div className="flex-1">
          <ScreenRowBase<IntroductionStep>
            screen={screen}
            nextScreen={nextScreen}
            idx={idx}
            screensLength={introduction?.length ?? 0}
            hasChild={hasAcceptChild}
            headerContent={
              isConnectScreen && screen.issuer_name ? (
                <div className="mb-3 px-2">
                  <p className="text-sm font-semibold text-bcgov-black">{screen.issuer_name}</p>
                </div>
              ) : null
            }
            childContent={
              hasAcceptChild && nextScreen?.credentials && nextScreen.credentials.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-xs font-semibold text-bcgov-black mb-3">Credentials</p>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {nextScreen.credentials.map((cred: any, credIdx: number) => (
                        <div
                          key={credIdx}
                          className="bg-white rounded p-4 border-l-4 border-bcgov-blue flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {cred.icon && (
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <img
                                src={`${publicBaseUrl}${cred.icon}`}
                                alt={cred.name}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-bcgov-black">{cred.name}</p>
                            {cred.attributes && cred.attributes.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600 space-y-1">
                                {cred.attributes.map((attr: any, attrIdx: number) => (
                                  <div key={attrIdx} className="grid grid-cols-[auto_1fr] gap-3">
                                    <span className="font-medium text-gray-700">{attr.name}:</span>
                                    <span className="text-gray-600">
                                      {truncateLongString(formatPredicateValue(attr.value), 200)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => setEditingCredentialIdx(credIdx)}
                              className="flex-shrink-0 p-2 text-gray-600 hover:text-bcgov-blue hover:bg-blue-50 rounded transition-colors"
                              title="Edit credential values"
                            >
                              <Cog6ToothIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null
            }
            isPredefinedScreen={
              screen.screenId === 'PICK_CHARACTER' ||
              screen.screenId === 'SETUP_COMPLETED' ||
              screen.screenId.startsWith('CONNECT')
            }
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            onEditClick={onEditClick}
            onAddScreenClick={onAddScreenClick}
            onShowDeleteConfirm={onShowDeleteConfirm}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            draggableId={`intro-screen-${idx}`}
            disableDragStart={
              !canEdit ||
              screen.screenId === 'PICK_CHARACTER' ||
              screen.screenId === 'SETUP_COMPLETED' ||
              screen.screenId.startsWith('CONNECT')
            }
            deleteTitle="Delete this connection and acceptance screens"
            hoverIdPrefix=""
            skipIconPlaceholder={true}
            showAddButton={canEdit && !screen.screenId.startsWith('ACCEPT') && !(isConnectScreen && hasAcceptChild)}
          />
        </div>
      </div>

      {/* Show "Add Connection and Issuance Screens" after CONNECT/ACCEPT pair */}
      {canEdit && isConnectScreen && hasAcceptChild && (
        <AddConnectionButton onClick={onSelectCredential} containerClassName="mt-2" />
      )}

      {/* Edit Credential Modal */}
      {editingCredentialIdx !== null && nextScreen?.credentials?.[editingCredentialIdx] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {(() => {
                const credential = nextScreen.credentials[editingCredentialIdx]
                return (
                  <DefineCredentialValuesStep
                    selectedSchema={selectedSchema || null}
                    initialValues={credential.attributes?.reduce((acc: Record<string, string>, attr: any) => {
                      acc[attr.name] = attr.value || ''
                      return acc
                    }, {})}
                    initialIcon={credential.icon}
                    onBack={() => {
                      setEditingCredentialIdx(null)
                      setSelectedSchema(null)
                    }}
                    onSelectCredential={async (values, icon) => {
                      if (nextScreen?.credentials) {
                        const updatedCredential = {
                          ...nextScreen.credentials[editingCredentialIdx],
                          attributes: credential.attributes?.map((attr: any) => ({
                            ...attr,
                            value: values[attr.name] || attr.value,
                          })),
                          icon,
                        }
                        nextScreen.credentials[editingCredentialIdx] = updatedCredential
                        try {
                          if (updatedCredential.id) {
                            await updateCredential(auth, updatedCredential.id, {
                              attributes: updatedCredential.attributes,
                              icon: updatedCredential.icon,
                            })
                          }
                          await onRefresh?.()
                        } catch (error) {
                          logger.error('Error saving credential update:', error)
                        }
                      }
                      setEditingCredentialIdx(null)
                      setSelectedSchema(null)
                    }}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
