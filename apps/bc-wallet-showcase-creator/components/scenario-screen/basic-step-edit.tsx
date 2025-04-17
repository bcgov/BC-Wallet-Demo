'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormTextInput, FormTextArea } from '@/components/text-input'
import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import DeleteModal from '../delete-modal'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import { useCreatePresentation } from '@/hooks/use-presentation'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { BasicStepFormData, basicStepSchema } from '@/schemas/onboarding'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { CredentialDefinition, PresentationScenarioRequest, StepType } from 'bc-wallet-openapi'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { LocalFileUpload } from './local-file-upload'
import { ErrorModal } from '../error-modal'
import { DisplaySearchResults } from '../onboarding-screen/display-search-results'
import { DisplayStepCredentials } from './display-step-credentials'
import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { useCredentials } from '@/hooks/use-credentials-store'
import { StepRequestUIActionTypes } from '@/lib/steps'

export const BasicStepEdit = () => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync } = useCreatePresentation()
  const { setScenarioIds } = useShowcaseStore()
  const { selectedScenario, updateStep, selectedStep, setStepState, deleteStep } =
    usePresentationAdapter()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions();
  const { setSelectedCredential, selectedCredential } = useCredentials()
  const { personaScenarios } = usePresentationCreation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showErrorModal, setErrorModal] = useState(false)

  const currentStep = selectedScenario && selectedStep !== null ? selectedScenario.steps[selectedStep.stepIndex] as StepRequestUIActionTypes : null

  const defaultValues = {
    title: currentStep?.title || '',
    description: currentStep?.description || '',
    asset: currentStep?.asset || undefined,
  }

  const form = useForm<BasicStepFormData>({
    resolver: zodResolver(basicStepSchema),
    defaultValues,
    mode: 'all',
  })

  useEffect(() => {
    if (currentStep) {
      form.reset(defaultValues)
    }
  }, [currentStep, form])

  const autoSave = debounce((data: BasicStepFormData) => {
    if (!currentStep || !form.formState.isDirty) return

    const updatedStep = {
      ...currentStep,
      title: data.title,
      description: data.description,
      asset: data.asset || undefined,
    }

    updateStep(currentStep.order, updatedStep)

    setTimeout(() => {
      toast.success('Changes saved', { duration: 1000 })
    }, 500)
  }, 800)

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        autoSave(value as BasicStepFormData)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, autoSave])

  const searchCredential = (searchText: string) => {
    setSearchResults([]);
    if (!searchText) return;

    const searchUpper = searchText.toUpperCase();

    if (!Array.isArray(credentials?.credentialDefinitions)) {
      console.error("Invalid credential data format");
      return;
    }

    const results = credentials.credentialDefinitions.filter((cred: any) =>
      cred.name.toUpperCase().includes(searchUpper)
    );

    setSearchResults(results);
  };

  const addCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return;
    const existing = currentStep.credentials || [];
    if (!existing.includes(credential)) {
      const updated = [...existing, credential];
      updateStep(selectedStep?.stepIndex || 0, { ...currentStep, credentials: updated } as StepRequestUIActionTypes);
    }
    setSearchResults([]);
  }

  const removeCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return;
    // @ts-expect-error: TODO: fix this
    const updated = (currentStep.credentials || []).filter((id: string) => id !== credential.id);

    updateStep(selectedStep?.stepIndex || 0, { ...currentStep, credentials: updated } as StepRequestUIActionTypes);
    setSelectedCredential(null);
  }

  const onSubmit = async (data: BasicStepFormData) => {
    autoSave.flush()

    const mappedScenarios = Array.from(personaScenarios.values()).flatMap((scenarios) =>
      scenarios.map((scenario) => ({
        ...scenario,
        steps: scenario.steps.map((step, index) => {
          const { credentials, ...restStep } = step as StepRequestUIActionTypes;
    
          return {
            ...restStep,
            order: index,
            asset: step.asset || undefined,
            actions:
              step.type === StepType.Service
                ? step.actions.map((action) => ({
                    ...action,
                    actionType: "ARIES_OOB",
                    credentialDefinitionId: selectedCredential?.id,
                  }))
                : step.actions,
          };
        }),
      })),
    )    
    const scenarioIds = []

    for (const scenario of mappedScenarios) {
      try {
        const result = await mutateAsync(scenario as PresentationScenarioRequest)
        if (result?.presentationScenario?.id) {
          scenarioIds.push(result.presentationScenario.id)
        }
        toast.success(`${scenario?.description || 'persona'} created`)
      } catch (error) {
        console.error('Error creating scenario:', error)
        setErrorModal(true)
        return
      }
    }

    setScenarioIds(scenarioIds)
    router.push(`/showcases/create/publish`)
  }

  if (!currentStep) return null

  if (showErrorModal) {
    return <ErrorModal errorText="Unknown error occurred" setShowModal={setErrorModal} />
  }

  return (
    <>
      <StepHeader
        icon={<Monitor strokeWidth={3} />}
        title={t('onboarding.basic_step_header_title')}
        onActionClick={(action) => {
          switch (action) {
            case 'save':
              console.log('Save Draft clicked')
              break
            case 'preview':
              console.log('Preview clicked')
              break
            case 'revert':
              console.log('Revert Changes clicked')
              break
            case 'delete':
              console.log('Delete Page clicked')
              setIsModalOpen(true)
              break
            default:
              console.log('Unknown action')
          }
        }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <FormTextInput
              label={t('scenario.edit_page_title_label')}
              control={form.control}
              name="title"
              register={form.register}
              error={form.formState.errors.title?.message}
              placeholder={t('scenario.edit_page_title_placeholder')}
            />

            <FormTextArea
              label={t('scenario.edit_page_description_label')}
              control={form.control}
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              placeholder={t('scenario.edit_page_description_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <LocalFileUpload
              text={t('onboarding.icon_label')}
              element="asset"
              existingAssetId={form.watch('asset')}
              handleLocalUpdate={(_, value) => {
                console.log('Value', value)
                if (!currentStep) return

                const updatedStep1 = {
                  ...currentStep,
                  title: currentStep.title,
                  description: currentStep.description,
                  asset: value || undefined,
                }
                updateStep(selectedStep?.stepIndex || 0, updatedStep1)

                form.setValue('asset', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
            />
          </div>

          {currentStep?.type == StepType.Service && (
            <div className="space-y-4 h-screen">
                <h4 className="text-xl font-bold">Request Options</h4>
                <hr />

                <div className="space-y-4">
                  <div>
                    <p className="text-md font-bold">Search for a Credential:</p>
                    <div className="flex flex-row justify-center items-center my-4">
                      <div className="relative w-full">
                        <input
                          className="dark:text-dark-text dark:bg-dark-input border dark:border-dark-border rounded pl-2 pr-10 mb-2 w-full bg-light-bg"
                          placeholder="ex. Student Card"
                          type="text"
                          onChange={(e) => searchCredential(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <DisplaySearchResults searchResults={searchResults} addCredential={addCredential} />

                  {currentStep && (
                    <DisplayStepCredentials
                      credentials={currentStep?.credentials as unknown as CredentialDefinition[]}
                      selectedStep={selectedStep?.stepIndex || 0}
                      selectedScenario={selectedStep?.scenarioIndex || 0}
                      removeCredential={removeCredential}
                    />
                  )}
                </div>
            </div>
          )}
          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={() => setStepState('no-selection')}>{t('action.cancel_label')}</ButtonOutline>
            {/* <Link href="/publish"> */}
            <ButtonOutline type="submit" disabled={!form.formState.isValid} onClick={form.handleSubmit(onSubmit)}>
              {t('action.next_label')}
            </ButtonOutline>
            {/* </Link> */}
          </div>
        </form>
      </Form>
      {/* Delete Modal */}
      <DeleteModal
        isLoading={false}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={() => {
          setIsModalOpen(false)
          deleteStep(selectedStep?.stepIndex as number)
        }}
        header="Are you sure you want to delete this page?"
        description="Are you sure you want to delete this page?"
        subDescription="<b>This action cannot be undone.</b>"
        cancelText="CANCEL"
        deleteText="DELETE"
      />
    </>
  )
}
