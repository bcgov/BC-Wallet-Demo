import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Form } from '@/components/ui/form'
import { useCreateAsset } from '@/hooks/use-asset'
import {
  useCreateCredentialDefinition,
  useCreateCredentialSchema,
  useCreateIssuer,
  useCreateRelyingParty,
  useDeleteCredentialDefinition,
} from '@/hooks/use-credentials'
import { useCredentials } from '@/hooks/use-credentials-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { ensureBase64HasPrefix } from '@/lib/utils'
import type {
  AssetRequest,
  AssetResponse,
  CredentialDefinitionResponse,
  CredentialSchemaRequestType,
  CredentialSchemaResponse,
  CredentialDefinitionRequest,
  IssuerResponse,
  RelyingPartyResponse,
} from '@/openapi-types'
import { CredentialSchemaRequest } from '@/openapi-types'
import { schema } from '@/schemas/credential'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { FileUploadFull } from '../file-upload'
import StepHeaderCredential from '../showcases-screen/step-header-credential'
import { FormTextInput } from "../text-input";
import { CredentialAttributes } from './components/credential-attribute'


import DeleteModal from '../delete-modal'

import { toast } from 'sonner'
import Image from 'next/image'

import { Button } from '../ui/button'

export const CredentialsForm = () => {
  const { selectedCredential, mode, setSelectedCredential, viewCredential } = useCredentials()
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [credentialLogo, setCredentialLogo] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: createAsset } = useCreateAsset()
  const { mutateAsync: createCredentialSchema } = useCreateCredentialSchema()

  const { mutateAsync: createCredentialDefinition } = useCreateCredentialDefinition()
  const { mutateAsync: createIssuer } = useCreateIssuer()
  const { mutateAsync: createRelyingParty } = useCreateRelyingParty()

  const { setIssuerId, setSelectedCredentialDefinitionIds, setRelayerId } = useHelpersStore()

  const { mutateAsync: deleteCredentialDefinition, isPending: isDeleting } = useDeleteCredentialDefinition()
  const form = useForm<CredentialSchemaRequestType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      version: '',
      attributes: [{ name: '', value: '', type: 'STRING' }],
    },
    mode: 'onChange',
    shouldFocusError: true,
  })

  const onSubmit = async (formData: CredentialSchemaRequestType) => {
    try {
      setIsSubmitting(true)

      const schemaPayload: CredentialSchemaRequestType = {
        name: formData.name || 'example_name',
        version: formData.version || 'example_version',
        identifierType: 'DID',
        source: 'CREATED',
        identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
        attributes: formData?.attributes?.map((item) => ({
          name: item.name,
          value: item.value,
          type: item.type,
        })),
      }

      const schemaResponse = (await createCredentialSchema(schemaPayload)) as typeof CredentialSchemaResponse._type
      const schemaId = schemaResponse?.credentialSchema?.id
      if (!schemaId) throw new Error('Failed to create schema')

      const assetPayload: z.infer<typeof AssetRequest> = {
        mediaType: 'image/jpeg',
        content: credentialLogo ?? '',
        fileName: 'example.jpg',
        description: 'Example asset',
      }

      const assetResponse = (await createAsset(assetPayload)) as typeof AssetResponse._type
      const assetId = assetResponse?.asset?.id

      const credentialDefinitionPayload: z.infer<typeof CredentialDefinitionRequest> = {
        name: formData.name || 'example_name',
        version: formData.version || 'example_version',
        credentialSchema: schemaId,
        identifierType: 'DID',
        identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
        type: 'ANONCRED',
        icon: assetId,
      }

      const credentialDefinition = (await createCredentialDefinition(
        credentialDefinitionPayload
      )) as typeof CredentialDefinitionResponse._type
      const credentialId = credentialDefinition?.credentialDefinition?.id

      if (!credentialId) throw new Error('Failed to create credential')

      const issuerResponse = (await createIssuer({
        name: 'dummy-issuer',
        type: 'ARIES',
        credentialDefinitions: [credentialId],
        credentialSchemas: [schemaId],
        description: '',
      })) as typeof IssuerResponse._type

      const relyingPartyResponse = (await createRelyingParty({
        name: 'dummy-relying-party',
        type: 'ARIES',
        credentialDefinitions: [credentialId],
        description: '',
      })) as typeof RelyingPartyResponse._type

      setIssuerId(issuerResponse.issuer.id)
      setRelayerId(relyingPartyResponse.relyingParty.id)

      const newCredential: (typeof CredentialDefinitionResponse._type)['credentialDefinition'] = {
        id: credentialId,
        name: formData.name,
        version: formData.version,
        type: 'ANONCRED' as const,
        createdAt: credentialDefinition?.credentialDefinition?.createdAt,
        updatedAt: credentialDefinition?.credentialDefinition?.updatedAt,
        credentialSchema: {
          id: schemaId,
          name: formData.name,
          version: formData.version,
          createdAt: schemaResponse?.credentialSchema?.createdAt,
          updatedAt: schemaResponse?.credentialSchema?.updatedAt,
        },
        icon: assetId,
      }

      setSelectedCredential(newCredential)
      viewCredential(newCredential)
      setSelectedCredentialDefinitionIds([credentialId])

      toast.success('Credential created successfully!')
    } catch (error) {
      toast.error('Error creating schema or credential definition.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCredential = async () => {
    if (selectedCredential) {
      await deleteCredentialDefinition(selectedCredential.id)
      setSelectedCredential(null)
      toast.success('Credential deleted successfully!')
      form.reset()
    }
  }
  const handleCancel = () => {
    form.reset()
    setCredentialLogo(undefined)
  }

  if (mode === 'view' && selectedCredential) {
    const credentialDefinition = selectedCredential

    const formattedDate = new Date(selectedCredential?.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const formattedTime = new Date(selectedCredential?.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    })

    return (
      <div className=" my-4">
        <div className="px-4">
          <StepHeaderCredential
            icon={<Monitor strokeWidth={3} />}
            title={t('credentials.view_header_title')}
            onActionClick={(action) => {
              switch (action) {
                case 'delete':
                  setIsModalOpen(true)
                  break
                default:
                  console.log('Unknown action')
              }
            }}
          />
        </div>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-6">
            {credentialDefinition.icon && (
              <div className="px-2 py-2">
                <Image
                  src={ensureBase64HasPrefix(credentialDefinition?.icon?.content) || '/assets/no-image.jpg'}
                  width={80}
                  height={80}
                  alt="Credential Icon"
                  className="rounded-full shadow object-cover"
                  style={{ aspectRatio: '1/1' }}
                />
              </div>
            )}
            {[
              {
                label: t('credentials.credential_name_label'),
                value: credentialDefinition?.name,
              },
              {
                label: 'Created At:',
                value: `${formattedDate} at ${formattedTime}`,
              },

              {
                label: t('credentials.version_label'),
                value: credentialDefinition?.version,
              },
              {
                label: t('credentials.schema_id_label'),
                value: credentialDefinition?.id,
              },
              {
                label: t('credentials.identifier_type_label'),
                value: credentialDefinition?.identifierType,
              },
              {
                label: t('credentials.identifier_label'),
                value: credentialDefinition?.identifier,
              },
              {
                label: t('credentials.type_label'),
                value: credentialDefinition?.type,
              },
              {
                label: t('credentials.revocation_label'),
                value: credentialDefinition?.revocation?.description ? 'Yes' : 'No',
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col p-4  dark:bg-dark-bg-secondary space-y-2">
                <h6 className="text-md font-semibold dark:text-white text-black">{item.label}</h6>
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{item.value || '—'}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 px-6 ">
            {/* Displaying Attributes */}
            {credentialDefinition?.credentialSchema &&
              (credentialDefinition.credentialSchema?.attributes?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  <CredentialAttributes
                    mode="view"
                    form={form as any}
                    attributes={credentialDefinition.credentialSchema.attributes}
                  />
                </div>
              )}
          </div>

          <div
            className="mx-8 flex items-center bg-[#F7F9FC] dark:bg-[#202223] dark:border-dark-border  border border-gray-300 rounded text-white text-sm font-bold px-4 py-3"
            role="alert"
          >
            <svg
              className="fill-current text-[#202223] dark:text-white w-4 h-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
            </svg>
            <p className="font-normal dark:text-white text-[#202223]">
              <span className="font-semibold">
                This credential is now available for use! <br />
              </span>
              You can select this credential when creating a <span className="font-semibold">Showcase </span>and assign
              it to any <span className="font-semibold">persona</span> in your scenario.
            </p>
          </div>
        </div>
        <DeleteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={() => handleDeleteCredential()}
          header="Are you sure you want to delete this credential?"
          description="Are you sure you want to delete this credential?"
          subDescription="<b>This action cannot be undone.</b>"
          cancelText="CANCEL"
          deleteText="DELETE"
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="my-2 flex flex-col">
        <div className="flex items-center gap-x-2 px-4 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-foreground">
            {mode === 'create' ? t('credentials.add_header_title') : t('credentials.view_header_title')}
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {mode === 'create' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormTextInput
                  label={t('credentials.credential_name_label')}
                  name="name"
                  register={form.register}
                  error={form.formState.errors.name?.message}
                  placeholder={t('credentials.credential_name_placeholder')}
                  control={form.control}
                />
                <FormTextInput
                  label={t('credentials.version_label')}
                  name="version"
                  register={form.register}
                  error={form.formState.errors.version?.message}
                  placeholder={t('credentials.version_placeholder')}
                  control={form.control}
                />
              </div>
              {/* <div className="flex space-x-4">
                <label className="text-sm font-bold" htmlFor="issuanceCheckbox">
                  {t("credentials.revocation_label")}
                </label>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("revocation")}
                    className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    {t("credentials.revocation_checkbox_label")}
                  </span>
                </div>
              </div> */}
              <div className="grid grid-cols-1 gap-4 mt-6">
                <div className="text-start">
                  <FileUploadFull
                    text={t('credentials.image_label')}
                    element="headshot_image"
                    handleJSONUpdate={(imageType, imageData) => {
                      setCredentialLogo(imageData)
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <CredentialAttributes mode="create" form={form as any} />
        </div>
        <div className="flex justify-end gap-4 mt-6 px-4">
          <Button type="button" variant="outlineAction" size="lg" onClick={handleCancel}>
            {t('action.cancel_label')}
          </Button>
          <Button
            variant="outlineAction"
            size="lg"
            type="submit"
            disabled={!form.formState.isDirty || !form.formState.isValid}
          >
            {isSubmitting ? 'CREATING...' : 'CREATE CREDENTIAL'}
          </Button>
        </div>
      </form>{' '}
    </Form>
  )
}
