import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { baseUrl, cn } from '@/lib/utils'
import type { ProofRequest, ProofRequestAttributes, ProofRequestPredicates, ShowcaseJSON } from '@/types'
import { Trash2, Edit } from 'lucide-react'
import Image from 'next/image'

import { NoSelection } from '../credentials/no-selection'
import { EditProofRequest } from './edit-proof-request'
import { CredentialDefinitionType } from '@/openapi-types'
import { ProofRequestFormData } from '@/schemas/scenario'

interface DisplayStepCredentialsProps {
  selectedCharacter?: number
  credentials: CredentialDefinitionType[];
  updateCredentials?:(updatedCredentials: ProofRequestFormData) => void;
  showcaseJSON?: ShowcaseJSON
  localData: {
    requestOptions?: {
      proofRequest?: ProofRequest
    }
  }
  selectedStep: number | null
  selectedScenario: number | null
  removeCredential: (credential: string) => void
}

export const DisplayStepCredentials = ({
  selectedCharacter,
  localData,
  selectedStep,
  selectedScenario,
  removeCredential,
  updateCredentials,
  credentials
}: DisplayStepCredentialsProps) => {
  const [editingCredentials, setEditingCredentials] = useState<number[]>([])

  if (credentials.length === 0) {
    return (
      <div className="m-5 p-5 w-full h-60">
        <NoSelection text="No Credentials Added" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-md font-bold">Credential(s) Added:</p>
      {/* TODO: FIX credential type */}
      {credentials.map((credential: any, index) => {

        if (!credential) return null

        const isEditing = editingCredentials.includes(index)

        return (
          <div key={credential.id} className="flex flex-col">
            <div className="w-full border border-dark-border dark:border-light-border rounded-t-lg">
              {/* Credential Header */}
              <div
                className={cn(
                  'px-4 py-3 rounded-t-lg flex items-center justify-between',
                  'bg-light-bg dark:bg-dark-bg'
                )}
              >
                <div className="flex items-center flex-1">
                  <Image
                    src={credential.icon?.id ? `${baseUrl}/assets/${credential.icon.id}/file` : '/assets/no-image.jpg'}
                    alt={credential?.icon?.description || 'default credential icon'}
                    width={50}
                    height={50}
                    className="rounded-full"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = '/assets/no-image.jpg'
                    }}
                  />
                  <div className="space-y-1 ml-4">
                    <p className="font-semibold">{credential.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {'Test college'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault()
                    removeCredential(credential)
                  }}
                  className="hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Proof Request Section */}
              <div className={cn('p-3 rounded-b-lg', 'bg-white dark:bg-dark-bg')}>
                {isEditing &&
                selectedStep !== null &&
                selectedScenario !== null ? (
                  <EditProofRequest
                    credentials={credential}
                    updateCredentials={updateCredentials}
                    proofRequest={localData.requestOptions?.proofRequest}
                    credentialName={credential?.credentialSchema?.name}
                    selectedCharacter={selectedCharacter}
                    selectedScenario={selectedScenario}
                    selectedStep={selectedStep}
                    setEditingCredentials={setEditingCredentials}
                    editingCredentials={editingCredentials}
                    editingIndex={index}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    className="text-xs font-semibold hover:bg-transparent hover:underline p-1"
                    onClick={(e) => {
                      e.preventDefault()
                      setEditingCredentials([...editingCredentials, index])
                    }}
                  >
                    EDIT PROOF REQUEST
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
