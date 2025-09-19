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
import { useTenant } from '@/providers/tenant-provider'
import { debugLog } from '@/lib/utils'

export const BasicStepEdit = ({ slug }: { slug?: string }) => {
  const t = useTranslations()
  const router = useRouter()
  const { updateScenario, createScenarios , selectedScenario, updateStep, selectedStep, setStepState, deleteStep, isEditMode,personaScenarios } =
    usePresentationAdapter()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions();
  const { setSelectedCredential, selectedCredential } = useCredentials()
  const { tenantId } = useTenant();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showErrorModal, setErrorModal] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

const isInvalidServiceStep = Array.from(personaScenarios).some(([_, scenarioList]) =>
  scenarioList.some((scenario) =>
    scenario.steps?.some(
      (step) =>
        step.type === "SERVICE" &&
        step.actions?.some((action) => {
          if (action.actionType !== "ARIES_OOB") return false;

          const credDefId = action.credentialDefinitionId;
          return credDefId === undefined || 
                 (typeof credDefId === "string" && credDefId.trim() === "");
        })
    )
  )
);

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
    const existing = currentStep.actions[0].credentialDefinitionId || '';
    if (!existing.includes(credential.id)) {
      const updated = [
        ...existing,
        {
          ...currentStep.actions[0],
          credentialDefinitionId: credential.id
        }
      ];
      updateStep(selectedStep?.stepIndex || 0, { ...currentStep, actions: updated } as StepRequestUIActionTypes);
    }
    setSearchResults([]);
  }

  const removeCredential = (credentialId: string) => {
    if (!currentStep) return;

    const { credentialDefinitionId, ...cleanedAction } = currentStep.actions[0];
     const updatedAction = {
        ...cleanedAction,
        proofRequest: {
          attributes: {},
          predicates: {},
        },
      }

    const updatedActions = [updatedAction];

    updateStep(selectedStep?.stepIndex || 0, { ...currentStep, actions: updatedActions } as unknown as StepRequestUIActionTypes);
    setSelectedCredential(null);
  }

  const onSubmit = async (data: BasicStepFormData) => {
    autoSave.flush()

    try {
      let result;
      if (isEditMode && slug) {
        result = await updateScenario(slug)

        if (result.success) {
          toast.success('Scenarios updated successfully')
          setIsUpdated(true)
          // router.push(`/${tenantId}/showcases/${slug}/publish`)
        } else {
          throw new Error(result.message || 'Failed to update scenarios')
        }
      } else {
        result = await createScenarios()

        if (result.success) {
          toast.success('Scenarios created successfully')
          setIsUpdated(true)
          // router.push(`/${tenantId}/showcases/create/publish`)
        } else {
          throw new Error(result.message || 'Failed to create scenarios')
        }
      }
    } catch (error) {
      console.error('Error during scenario operation:', error)
      setErrorModal(true)
    }
  }

  const GoToNext = () => {
    if (isEditMode && slug) {
      router.push(`/${tenantId}/showcases/${slug}/publish`)
    } else {
      router.push(`/${tenantId}/showcases/create/publish`)
    }
  }

  if (!currentStep) return null

  if (showErrorModal) {
    return <ErrorModal errorText="Unknown error occurred" setShowModal={setErrorModal} />
  }

  const action = currentStep?.actions?.[0];

  // Extended validation for predicates (same as onSubmit)
  const hasInvalidPredicates =
    action?.proofRequest &&
    currentStep.type === StepType.Service &&
    Object.values(action.proofRequest.predicates || {}).some((predGroup: any) =>
      (predGroup.predicates || []).some(
        (p: any) =>
          (p.type === '>=' || p.type === '<=') &&
          (String(p.value) === '0' || !/^\d{8}$/.test(String(p.value)))
      )
    )

  // Extended validation for attributes/predicates existence
  const hasNoAttributesOrPredicates =
    action?.proofRequest &&
    currentStep.type === StepType.Service &&
    Object.values(action.proofRequest.attributes || {}).every(
      (attrGroup: any) => !attrGroup.attributes || attrGroup.attributes.length === 0
    ) &&
    Object.values(action.proofRequest.predicates || {}).every(
      (predGroup: any) => !predGroup.predicates || predGroup.predicates.length === 0
    )

    console.log('Test',action?.proofRequest);

    console.log('hasNoAttributesOrPredicates', hasNoAttributesOrPredicates);
    console.log('hasInvalidPredicates', hasInvalidPredicates);

    const isProofRequestEmpty =
    action?.proofRequest && currentStep.type === StepType.Service &&
    Object.keys(action.proofRequest.attributes || {}).length === 0 &&
    Object.keys(action.proofRequest.predicates || {}).length === 0;

    const isProofRequestInvalid = isProofRequestEmpty || hasNoAttributesOrPredicates || hasInvalidPredicates


  const getInstructionalText = () => {
        if (currentStep?.order === 0) {
          return 'This screen will provide the end-user a QR code to scan and receive a proof request on their BC Wallet to share request information from their credential. Please edit the default language for your showcase';
        } else if (currentStep?.order === 1) {
          return 'On this screen, you will add details about the credential attributes the end-user will share.  Please edit the default language for your showcase';
        } else if (currentStep?.order === 2) {
          return 'This screen will provide the. end-user a message that they have successfully shared the credential from their BC Wallet. Please edit the default language for your showcase';
        }
    };

    const getStepTitle = () => {
        if (currentStep?.order === 0)  {
          return 'Edit Scan QR Code step';
        }
        if (currentStep?.order === 1)  {
          return 'Edit Information to Share step';
        }
         if (currentStep?.order === 2)  {
          return 'Edit Credential Shared step'
        }
 
        return t('onboarding.basic_step_header_title');
      }

  return (
    <>
      <StepHeader
        icon={<Monitor strokeWidth={3} />}
        deleteTitle='Delete step'
        showDropdown={(currentStep?.order ?? 0) >= 3}
        title={getStepTitle()}
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
          {getInstructionalText() && (
            <p className="text-sm text-muted-foreground mb-4">
                {getInstructionalText()}
            </p>
          )}
          <div className="space-y-6">
            <FormTextInput
              label={t('scenario.edit_page_title_label')}
              control={form.control}
              name="title"
              register={form.register}
              error={form.formState.errors.title?.message}
              isMandatory={true}
              placeholder={t('scenario.edit_page_title_placeholder')}
            />

            <FormTextArea
              label={t('scenario.edit_page_description_label')}
              control={form.control}
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              isMandatory={true}
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
            <div className="space-y-4">
              <h4 className="text-md font-bold">Confirm the information to send in the proof request</h4>
              <hr />

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{'In this section, you must search for and select a credential to be shared. Add the credential attribute(s) you wish the end-user to share. Please make sure to Save before proceeding.'}</p>
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
                {/* <pre>{JSON.stringify(currentStep, null, 2)}</pre> */}
                {currentStep && (
                  <DisplayStepCredentials
                    credentialId={currentStep?.actions[0].credentialDefinitionId}
                    selectedStep={selectedStep?.stepIndex || 0}
                    selectedScenario={selectedStep?.scenarioIndex || 0}
                    removeCredential={removeCredential}
                  />
                )}
              </div>
            </div>
          )}
          <div className="mt-auto pt-4 border-t flex justify-between ">
            <ButtonOutline onClick={() => setStepState('no-selection')}>{'help'}</ButtonOutline>

          <div className='flex gap-4'>

            <ButtonOutline type="button" 
              disabled={!form.formState.isValid}
              onClick={form.handleSubmit(onSubmit)}
            >
              {'Save'}
            </ButtonOutline>

            <ButtonOutline type="button" 
              disabled={!isUpdated}
              // disabled={!form.formState.isValid || isProofRequestInvalid || isInvalidServiceStep}
              onClick={() => GoToNext()}
            >
              {'Proceed to Publish'}
            </ButtonOutline>
          </div>

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
