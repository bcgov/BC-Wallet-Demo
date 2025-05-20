import { NoSelection } from '../credentials/no-selection'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn, baseUrl } from '@/lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import ButtonOutline from '../ui/button-outline'
import { useUpdateCredentialSchema } from '@/hooks/use-credentials'
import { useCredentialDefinition } from '@/hooks/use-credentials'
import type { CredentialSchemaRequest, CredentialAttribute } from 'bc-wallet-openapi'
import { Skeleton } from '../ui/skeleton'
import { useTenant } from '@/providers/tenant-provider'

interface DisplayCredentialProps {
  credentialId: string
  removeCredential?: () => void
  onCredentialUpdate?: (credentialId: string) => void
}

export const DisplayCredential = ({ credentialId, removeCredential, onCredentialUpdate }: DisplayCredentialProps) => {
  const t = useTranslations()
  const { mutateAsync: updateCredentialSchema } = useUpdateCredentialSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { tenantId } = useTenant()

  const [credentialAttributes, setCredentialAttributes] = useState<CredentialAttribute[]>([])

  const { data, isLoading, error, refetch } = useCredentialDefinition(credentialId)

  useEffect(() => {
    if (data?.credentialDefinition?.credentialSchema?.attributes) {
      setCredentialAttributes([...data.credentialDefinition.credentialSchema.attributes])
    }
  }, [data])

  if (isLoading) {
    return <Skeleton className="w-full h-full" />
  }

  if (error || !data) {
    return (
      <div className="m-5 p-5 w-full">
        <NoSelection text={t('credentials.error_fetching_credential')} />
      </div>
    )
  }

  const handleAttributeChange = (attrIndex: number, newValue: string) => {
    setCredentialAttributes(currentAttributes => {
      return currentAttributes.map((attr, i) =>
        i === attrIndex ? { ...attr, value: newValue } : attr
      )
    })
  }

  const handleSaveAttributes = async () => {
    if (!data || !data.credentialDefinition || !data.credentialDefinition.credentialSchema) {
      console.error('Missing credential schema data')
      return
    }

    const schemaPayload: CredentialSchemaRequest = {
      name: data.credentialDefinition.credentialSchema.name,
      version: data.credentialDefinition.credentialSchema.version,
      identifierType: data.credentialDefinition.credentialSchema.identifierType || 'DID',
      source: data.credentialDefinition.credentialSchema.source || 'CREATED',
      attributes: credentialAttributes.map((attr) => ({
        name: attr.name,
        value: attr.value || '',
        type: attr.type,
      })),
    }

    try {
      const schemaResponse = await updateCredentialSchema({
        credentialSchemaId: data.credentialDefinition.credentialSchema.id,
        data: schemaPayload,
      })
      console.log(`Updated schema for credential ${data.credentialDefinition.id}`, schemaResponse)

      if (onCredentialUpdate) {
        onCredentialUpdate(credentialId)
      }

      refetch()
      setIsEditing(false)
    } catch (error) {
      console.error(`Failed to update schema for credential`, error)
    }
  }

  return (
    <div>
      <p className="text-md font-bold mt-2">{t('credentials.credential_added_label')}</p>

      <div className="flex flex-col pt-2">
        <div className="w-full border border-dark-border dark:border-light-border rounded-t-lg">
          <div
            className={cn('px-4 py-3 rounded-t-lg flex items-center justify-between', 'bg-light-bg dark:bg-dark-bg')}
          >
            <div className="flex items-center flex-1">
              <Image
                src={
                  data.credentialDefinition?.icon?.id
                    ? `${baseUrl}/${tenantId}/assets/${data.credentialDefinition?.icon?.id}/file`
                    : '/assets/no-image.jpg'
                }
                alt={data.credentialDefinition?.icon?.description || 'default credential icon'}
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
                <p className="font-semibold">{data.credentialDefinition?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.credentialDefinition?.credentialSchema?.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center items-start">
              <p className="font-semibold">{t('credentials.attributes_label')}</p>
              <p>{credentialAttributes.length}</p>
            </div>

            {removeCredential && (
              <div className="flex-1 flex justify-end items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault()
                    removeCredential()
                  }}
                  className="hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="p-2">
            <Button
              variant="ghost"
              type="button"
              className="text-xs font-semibold hover:bg-transparent hover:underline p-1"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'HIDE ATTRIBUTES' : 'EDIT ATTRIBUTE VALUES'}
            </Button>
          </div>

          {isEditing && (
            <>
              <div className="p-3 rounded-b-lg bg-white dark:bg-dark-bg">
                {credentialAttributes.map(
                  (attr: CredentialAttribute, attrIndex: number) => (
                    <div key={attr.id || attrIndex} className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 flex flex-col justify-center p-4">
                        <label className="text-sm font-bold">{t('credentials.attribute_label')}</label>
                        <Input
                          className="text-light-text dark:text-dark-text border border-dark-border dark:border-light-border"
                          value={attr.name}
                          disabled
                        />
                      </div>

                      <div className="space-y-2 flex flex-col justify-center p-4">
                        <label className="text-sm font-bold">{t('credentials.attribute_value_placeholder')}</label>
                        <Input
                          value={attr.value || ''}
                          onChange={(e) => handleAttributeChange(attrIndex, e.target.value)}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="justify-self-center mb-2 flex justify-center">
                <ButtonOutline type="button" onClick={handleSaveAttributes}>
                  {t('action.save_label')}
                </ButtonOutline>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}