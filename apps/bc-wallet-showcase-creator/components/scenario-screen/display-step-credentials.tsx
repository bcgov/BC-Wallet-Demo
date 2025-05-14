import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { baseUrl, cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'

import { NoSelection } from '../credentials/no-selection'
import { EditProofRequest } from './edit-proof-request'
import { ProofRequestFormData } from '@/schemas/scenario'
import { useCredentialDefinition } from '@/hooks/use-credentials'
import { useTenant } from '@/providers/tenant-provider'

interface DisplayStepCredentialsProps {
  credentialId?: string
  updateCredentials?: (updatedCredentials: ProofRequestFormData) => void
  selectedStep: number | null
  selectedScenario: number | null
  removeCredential: (credential: string) => void
}

export const DisplayStepCredentials = ({
  selectedStep,
  selectedScenario,
  removeCredential,
  updateCredentials,
  credentialId,
}: DisplayStepCredentialsProps) => {
  const [editingCredentials, setEditingCredentials] = useState<number[]>([0])
  const { data: cred } = useCredentialDefinition(credentialId ?? '')
  const { tenantId } = useTenant();

  if (!credentialId) {
    return (
      <div className="m-5 p-5 w-full h-60">
        <NoSelection text="No Credentials Added" />
      </div>
    )
  }

  if (!credentialId) return null
  const isEditing = editingCredentials.includes(0)

  return (
    <div className="space-y-4">
      <p className="text-md font-bold">Credential(s) Added:</p>
      {/* TODO: FIX credential type */}

      <div className="w-full border border-dark-border dark:border-light-border rounded-t-lg">
        {/* Credential Header */}
        <div className={cn('px-4 py-3 rounded-t-lg flex items-center justify-between', 'bg-light-bg dark:bg-dark-bg')}>
          <div className="flex items-center flex-1">
            <Image
              src={
                cred?.credentialDefinition?.icon?.id
                  ? `${baseUrl}/${tenantId}/assets/${cred?.credentialDefinition?.icon?.id}/file`
                  : '/assets/no-image.jpg'
              }
              alt={cred?.credentialDefinition?.icon?.description || 'default credential icon'}
              width={50}
              height={50}
              className="rounded-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.src = '/assets/no-image.jpg'
              }}
            />
            <div className="space-y-1 ml-4">
              <p className="font-semibold">{cred?.credentialDefinition?.credentialSchema?.name}</p>
              <p className="text-sm text-muted-foreground">{'Test college'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              removeCredential(credentialId)
            }}
            className="hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Proof Request Section */}
        <div className={cn('p-3 rounded-b-lg', 'bg-white dark:bg-dark-bg')}>
          {isEditing && selectedStep !== null && selectedScenario !== null ? (
            <EditProofRequest
              credentialId={credentialId}
              updateCredentials={updateCredentials}
              selectedScenario={selectedScenario}
              selectedStep={selectedStep}
              setEditingCredentials={setEditingCredentials}
              editingCredentials={editingCredentials}
              editingIndex={0}
            />
          ) : (
            <Button
              variant="ghost"
              className="text-xs font-semibold hover:bg-transparent hover:underline p-1"
              onClick={(e) => {
                e.preventDefault()
                setEditingCredentials([...editingCredentials, 0])
              }}
            >
              EDIT PROOF REQUEST
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
