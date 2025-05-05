'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { usePersonaAdapter } from '@/hooks/use-persona-adapter'
import StepHeader from '@/components/step-header'
import { FormTextInput, FormTextArea } from '@/components/text-input'
import ButtonOutline from '@/components/ui/button-outline'
import { Form } from '@/components/ui/form'
import { baseUrl, cn } from '@/lib/utils'
import { characterSchema } from '@/schemas/character'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, EyeOff, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { toast } from 'sonner'
import type { z } from 'zod'
import { useState } from 'react'
import DeleteModal from '../delete-modal'
import { FileUploadFull } from '../file-upload'
import { useRouter } from '@/i18n/routing'
import type { Persona } from 'bc-wallet-openapi'
import { useTenant } from '@/providers/tenant-provider'

type CharacterFormData = z.infer<typeof characterSchema>

export default function NewCharacterPage({ slug }: { slug?: string }) {
  const t = useTranslations()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProceeding, setIsProceeding] = useState(false)
  const { tenantId } = useTenant();

  const {
    // State
    selectedPersonaId,
    selectedPersona,
    headshotImage,
    setHeadshotImage,
    setIsHeadshotImageEdited,
    bodyImage,
    setBodyImage,
    setIsBodyImageEdited,
    personasData,
    isLoading,

    // Actions
    savePersona,
    deleteCurrentPersona,
    handlePersonaSelect,
    handleCreateNew,
    handleCancel,

    // UI state
    personaState,

    // Derived data
    selectedPersonaIds,
  } = usePersonaAdapter();

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
        { keepDefaultValues: false },
      )
    } else if (!selectedPersonaId) {
      form.reset(
        {
          name: '',
          role: '',
          description: '',
          hidden: false,
        },
        { keepDefaultValues: false },
      )
    }
  }, [selectedPersona, selectedPersonaId, form])

  const handleFormSubmit = async (data: CharacterFormData) => {
    try {
      await savePersona({
        name: data.name,
        role: data.role,
        description: data.description,
        hidden: data.hidden,
        headshotImage: headshotImage || undefined,
        bodyImage: bodyImage || undefined,
      });

      handleCreateNew();

      form.reset({
        name: '',
        role: '',
        description: '',
        hidden: false,
      });

      setHeadshotImage(null);
      setBodyImage(null);
      setIsHeadshotImageEdited(false);
      setIsBodyImageEdited(false);

    } catch (error) {
      toast.error(t('character.error_character_creation_label'));
    }
  };

  const handleDelete = async () => {
    setIsModalOpen(false)
    await deleteCurrentPersona()
  }

  const handleProceed = async () => {
    const hasUnsavedChanges = form.formState.isDirty && personaState === 'editing-persona';

    if (hasUnsavedChanges) {
      toast.warning(t('character.warning_unsaved_changes_label'));
      return;
    }

    if (selectedPersonaIds.length === 0) {
      toast.error(t('character.error_no_characters_created_label'));
      return;
    }

    setIsProceeding(true);

    try {
      if (slug) {
        router.push(`/${tenantId}/showcases/${slug}/onboarding`);
      } else {
        router.push(`/${tenantId}/showcases/create/onboarding`);
      }
    } catch (error) {
      toast.error(t('character.error_proceed_label'));
    } finally {
      setIsProceeding(false);
    }
  };

  const onlyRecentlyCreated = (persona: Persona) => {
    return selectedPersonaIds.find((id: string) => id === persona.id)
  }

  return (
    <>
      <div className="flex dark:text-dark-text text-light-text flex-col h-full w-full">
        <div className="flex flex-col">
          <div className="flex gap-4 p-4 h-[calc(100vh-225px)]">
            {/* Left panel - Character list */}
            <div className="w-1/3 bg-background border shadow-md rounded-md flex flex-col">
              <div className="p-4">
                <h2 className="text-lg font-bold">{t('character.create_your_character_title')}</h2>
                <p className="text-sm">{t('character.create_your_character_subtitle')}</p>
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
                        className={cn("cursor-pointer transition-all duration-300 hover:bg-light-bg dark:hover:bg-dark-input-hover relative p-4 border-t border-b border-light-border-secondary dark:border-dark-border flex",
                          selectedPersonaId === persona.id
                            ? 'flex-col items-center bg-gray-100 dark:bg-dark-bg border border-light-border-secondary'
                            : 'flex-row items-center bg-background'
                        )}
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
                              persona.headshotImage?.id
                                ? `${baseUrl}/assets/${persona.headshotImage.id}/file`
                                : '/assets/no-image.jpg'
                            }
                            alt={persona.headshotImage?.description || 'Character headshot'}
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
            <div className="w-2/3 bg-background border shadow-md rounded-md p-6 flex flex-col">
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
                            handleCancel()
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
                                  selectedPersona?.headshotImage?.id
                                    ? `${baseUrl}/assets/${selectedPersona.headshotImage.id}/file`
                                    : undefined
                                }
                                handleJSONUpdate={(imageType, imageData) => {
                                  setHeadshotImage(imageData);
                                  setIsHeadshotImageEdited(true);
                                }}
                              />
                            </div>
                            <div className="text-start">
                              <FileUploadFull
                                text={t('character.full_body_image_label')}
                                element={'body_image'}
                                initialValue={
                                  selectedPersona?.bodyImage?.id
                                    ? `${baseUrl}/assets/${selectedPersona.bodyImage.id}/file`
                                    : undefined
                                }
                                handleJSONUpdate={(imageType, imageData) => {
                                  setBodyImage(imageData);
                                  setIsBodyImageEdited(true);
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
                          <ButtonOutline onClick={(e) => {
                            e.preventDefault()
                            handleProceed()
                          }} disabled={isProceeding || selectedPersonaIds.length === 0}>
                            {t('action.next_label')}
                          </ButtonOutline>

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
        onDelete={handleDelete}
        header={t('character.character_delete_title')}
        description={t('character.character_delete_title')}
        subDescription={t('character.character_delete_description')}
        cancelText={t('action.cancel_label')}
        deleteText={t('action.delete_label')}
      />
    </>
  )
}
