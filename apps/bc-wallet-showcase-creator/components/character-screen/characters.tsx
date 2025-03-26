'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import StepHeader from '@/components/step-header'
import { FormTextInput, FormTextArea } from '@/components/text-input'
import ButtonOutline from '@/components/ui/button-outline'
import { Form } from '@/components/ui/form'
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona } from '@/hooks/use-personas'
import { useShowcaseStore as usePersonaUIStore } from '@/hooks/use-showcase-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'

import apiClient from '@/lib/apiService'
import { ensureBase64HasPrefix } from '@/lib/utils'
import type { Persona } from '@/openapi-types'
import { characterSchema } from '@/schemas/character'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, EyeOff, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { toast } from 'sonner'
import type { z } from 'zod'

import DeleteModal from '../delete-modal'
import { FileUploadFull } from '../file-upload'
import { useRouter } from '@/i18n/routing'
type CharacterFormData = z.infer<typeof characterSchema>

export default function NewCharacterPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [headshotImage, setHeadshotImage] = useState<string | null>(null)
  const [isHeadShotImageEdited, setHeadShotImageEdited] = useState<boolean>(false)
  const [bodyImage, setBodyImage] = useState<string | null>(null)
  const [isBodyImageEdited, setIsBodyImageEdited] = useState<boolean>(false)
  const router = useRouter()
  // Track the selected persona by ID for UI stability
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)

  const { setEditMode, personaState, setStepState } = usePersonaUIStore()
  const { selectedPersonaIds, setSelectedPersonaIds } = useShowcaseStore()

  const { data: personasData, isLoading } = usePersonas()
  const { mutateAsync: createPersona } = useCreatePersona()
  const { mutateAsync: updatePersona } = useUpdatePersona()
  const { mutateAsync: deletePersona } = useDeletePersona()

  const selectedPersona = personasData?.personas?.find((p: Persona) => p.id === selectedPersonaId) || null

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      role: '',
      description: '',
      hidden: false,
    },
    mode: 'onChange',
    shouldFocusError: true,
  })

  useEffect(() => {
    if (selectedPersona) {
      form.reset(
        {
          name: selectedPersona.name || '',
          role: selectedPersona.role || '',
          description: selectedPersona.description || '',
          hidden: selectedPersona.hidden || false,
        },
        { keepDefaultValues: false }
      )

      // Reset image states
      setHeadShotImageEdited(false)
      setIsBodyImageEdited(false)

      // Load existing images
      setHeadshotImage(
        selectedPersona.headshotImage?.content ? ensureBase64HasPrefix(selectedPersona.headshotImage.content) : null
      )
      setBodyImage(selectedPersona.bodyImage?.content ? ensureBase64HasPrefix(selectedPersona.bodyImage.content) : null)
    } else if (!selectedPersonaId) {
      // Reset form when creating new
      form.reset(
        {
          name: '',
          role: '',
          description: '',
          hidden: false,
        },
        { keepDefaultValues: false }
      )

      setHeadShotImageEdited(false)
      setIsBodyImageEdited(false)
      setHeadshotImage(null)
      setBodyImage(null)
    }
  }, [selectedPersona, form])

  const handleFormSubmit = async (data: CharacterFormData) => {
    try {
      let headshotAssetId = selectedPersona?.headshotImage?.id
      let bodyAssetId = selectedPersona?.bodyImage?.id

      // Process headshot image if edited
      if (isHeadShotImageEdited && headshotImage) {
        const headshotPayload = {
          mediaType: 'image/jpeg',
          content: headshotImage,
          fileName: 'Headshot.jpg',
          description: 'A headshot image',
        }
        const headshotResponse: any = await apiClient.post('/assets', headshotPayload)
        headshotAssetId = headshotResponse.asset.id
      } else if (isHeadShotImageEdited && !headshotImage) {
        // If edited to remove image
        headshotAssetId = null
      }

      // Process body image if edited
      if (isBodyImageEdited && bodyImage) {
        const bodyPayload = {
          mediaType: 'image/jpeg',
          content: bodyImage,
          fileName: 'Body.jpg',
          description: 'A full-body image',
        }
        const bodyResponse: any = await apiClient.post('/assets', bodyPayload)
        bodyAssetId = bodyResponse.asset.id
      } else if (isBodyImageEdited && !bodyImage) {
        // If edited to remove image
        bodyAssetId = null
      }

      const personaData = {
        name: data.name,
        role: data.role,
        description: data.description,
        hidden: data.hidden,
        headshotImage: headshotAssetId,
        bodyImage: bodyAssetId,
      }

      // Update or create persona based on whether we're editing
      if (selectedPersonaId && selectedPersona) {
        // Use the proper React Query mutation with slug and data
        await updatePersona({
          slug: selectedPersona.slug,
          data: personaData,
        })

        toast.success('Persona has been updated.')
        setStepState('no-selection')
        setEditMode(false)
      } else {
        await createPersona(personaData, {
          onSuccess: (data: unknown) => {
            setSelectedPersonaId((data as { persona: Persona }).persona.id)
            setSelectedPersonaIds([...selectedPersonaIds, (data as { persona: Persona }).persona.id])
            toast.success('Persona has been created.')
          },
        })
      }

      // Reset image editing states but don't reset the form
      setHeadShotImageEdited(false)
      setIsBodyImageEdited(false)
    } catch (error) {
      toast.error('Error saving persona.')
    }
  }

  const handleCancel = () => {
    form.reset()
    setHeadshotImage(null)
    setBodyImage(null)
    setSelectedPersonaId(null)
    setEditMode(false)
    setStepState('no-selection')
  }

  const handlePersonaSelect = (persona: any) => {
    setSelectedPersonaId(persona.id)
    setStepState('editing-persona')
  }

  const handleCreateNew = () => {
    setSelectedPersonaId(null)
    form.reset()
    setStepState('creating-new')
  }

  const handleDeletePersona = async () => {
    if (selectedPersonaId && selectedPersona) {
      // Use slug for the API call with the React Query mutation
      await deletePersona(selectedPersona.slug)
      // No need to manually invalidate as it's handled in the mutation's onSettled
      setSelectedPersonaId(null)
      setStepState('no-selection')
    }
  }

  const onlyRecentlyCreated = (persona: Persona) => {
    return selectedPersonaIds.find((id: string) => id === persona.id)
  }

  const handleProceed = () => {
    if (selectedPersonaIds.length === 0) {
      toast.error('Please select at least one character to proceed')
      return
    }

    toast.success('Characters selected successfully')
    router.push('/showcases/create/onboarding')
  }
  return (
    <>
      <div className="flex dark:text-dark-text text-light-text flex-col h-full w-full">
        <div className="flex flex-col">
          <div className="flex gap-4 p-4 h-[calc(100vh-225px)]">
            {/* Left panel - Character list */}
            <div className="w-1/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
              <div className="p-4">
                <h2 className="text-lg font-bold">{t('character.select_your_character_title')}</h2>
                <p className="text-sm">{t('character.select_your_character_subtitle')}</p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading characters
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto">
                  {personasData?.personas &&
                    personasData.personas.filter(onlyRecentlyCreated).map((persona: Persona) => (
                      <div
                        key={persona.id}
                        className={`hover:bg-light-bg dark:hover:bg-dark-input-hover relative p-4 border-t border-b border-light-border-secondary dark:border-dark-border flex ${
                          selectedPersonaId === persona.id
                            ? 'flex-col items-center bg-gray-100 dark:bg-dark-bg border border-light-border-secondary'
                            : 'flex-row items-center bg-white dark:bg-dark-bg-secondary'
                        }`}
                        onClick={() => handlePersonaSelect(persona)}
                      >
                        {selectedPersonaId === persona.id && persona.hidden && (
                          <div className="flex gap-2 items-center absolute top-4 left-24 bg-[#D9D9D9] text-light-text dark:text-dark-text px-4 py-2 text-sm font-medium rounded">
                            <EyeOff size={22} />
                            {t('character.hidden_label')}
                          </div>
                        )}

                        <div className={`shrink-0 ${selectedPersonaId === persona.id ? 'mb-4 mt-12' : 'mr-4'}`}>
                          <Image
                            src={
                              persona.headshotImage?.content
                                ? ensureBase64HasPrefix(persona.headshotImage.content)
                                : '/assets/NavBar/Joyce.png'
                            }
                            alt={persona.name}
                            width={selectedPersonaId === persona.id ? 100 : 50}
                            height={selectedPersonaId === persona.id ? 100 : 50}
                            className="rounded-full aspect-square object-cover"
                          />
                        </div>

                        <div className={`${selectedPersonaId === persona.id ? 'text-center' : 'flex-1'}`}>
                          <h3 className="text-lg font-semibold">{persona.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{persona.role}</p>
                          {selectedPersonaId === persona.id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{persona.description}</p>
                          )}
                        </div>
                        <div>
                          <ButtonOutline
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePersonaSelect(persona)
                            }}
                            className={`${selectedPersonaId === persona.id ? 'mt-4' : 'mt-0'}`}
                          >
                            {t('action.edit_label')}
                          </ButtonOutline>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="p-4 mt-auto">
                <ButtonOutline className="w-full" onClick={handleCreateNew}>
                  {t('character.create_new_character_label')}
                </ButtonOutline>
              </div>
            </div>

            {/* Right panel - Form */}
            <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md p-6 flex flex-col">
              {personaState === 'creating-new' || personaState === 'editing-persona' ? (
                <div>
                  <StepHeader
                    icon={<Monitor strokeWidth={3} />}
                    title={t('character.character_detail')}
                    onActionClick={(action) => {
                      switch (action) {
                        case 'save':
                          form.handleSubmit(handleFormSubmit)()
                          break
                        case 'delete':
                          if (selectedPersonaId) {
                            setIsModalOpen(true)
                          } else {
                            setEditMode(false)
                          }
                          break
                        default:
                          console.log('Action:', action)
                      }
                    }}
                  />
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                      <div>
                        <div className="flex-grow">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <FormTextInput
                                label={t('character.edit_name_label')}
                                name="name"
                                register={form.register}
                                error={form.formState.errors.name?.message}
                                placeholder={t('character.edit_name_placeholder')}
                                control={form.control}
                              />
                            </div>
                            <div>
                              <FormTextInput
                                label={t('character.edit_role_label')}
                                name="role"
                                register={form.register}
                                error={form.formState.errors.role?.message}
                                placeholder={t('character.edit_role_placeholder')}
                                control={form.control}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <FormTextArea
                              label={t('character.edit_description_label')}
                              name="description"
                              register={form.register}
                              error={form.formState.errors.description?.message}
                              placeholder={t('character.edit_description_placeholder')}
                              control={form.control}
                            />
                          </div>

                          {form.watch('hidden') && (
                            <div className="w-full bg-[#FDF6EA] dark:bg-[#F9DAAC] p-6 mt-4 border-[1px] border-[#F9DAAC] rounded-md flex gap-2">
                              <CircleAlert size={22} />
                              <div>
                                <p className="text-light-text dark:text-dark-text text-sm font-semibold">
                                  {t('character.warning_label')}
                                </p>
                                <p className="text-light-text dark:text-dark-text text-sm font-semibold">
                                  {t('character.warning_placeholder_label')}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-start">
                              <FileUploadFull
                                text={t('character.headshot_image_label')}
                                element={'headshot_image'}
                                initialValue={
                                  selectedPersona?.headshotImage?.content
                                    ? ensureBase64HasPrefix(selectedPersona.headshotImage.content)
                                    : ''
                                }
                                handleJSONUpdate={(imageType, imageData) => {
                                  setHeadshotImage(imageData)
                                  setHeadShotImageEdited(true)
                                }}
                              />
                            </div>
                            <div className="text-start">
                              <FileUploadFull
                                text={t('character.full_body_image_label')}
                                element={'body_image'}
                                initialValue={
                                  selectedPersona?.bodyImage?.content
                                    ? ensureBase64HasPrefix(selectedPersona.bodyImage.content)
                                    : ''
                                }
                                handleJSONUpdate={(imageType, imageData) => {
                                  setBodyImage(imageData)
                                  setIsBodyImageEdited(true)
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t flex justify-end gap-3">
                          <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>
                          <ButtonOutline type="submit" disabled={!form.formState.isValid}>
                            {t('action.save_label')}
                          </ButtonOutline>
                          <ButtonOutline disabled={selectedPersonaIds.length === 0} onClick={handleProceed}>
                            {t('action.next_label')}
                          </ButtonOutline>
                          {process.env.NODE_ENV === 'development' && (
                            <ButtonOutline className="bg-red-500" onClick={() => setSelectedPersonaIds([])}>
                              Clear storage
                            </ButtonOutline>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="self-center justify-center mt-[23%]">{t('character.no_character_selected_label')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DeleteModal
        isOpen={isModalOpen}
        isLoading={false}
        onClose={() => setIsModalOpen(false)}
        onDelete={() => {
          setIsModalOpen(false)
          handleDeletePersona()
        }}
        header={t('character.character_delete_title')}
        description={t('character.character_delete_title')}
        subDescription={t('character.character_delete_description')}
        cancelText={t('action.cancel_label')}
        deleteText={t('action.delete_label')}
      />
    </>
  )
}
