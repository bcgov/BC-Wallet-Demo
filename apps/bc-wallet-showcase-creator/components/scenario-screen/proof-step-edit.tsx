'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { FormTextInput, FormTextArea } from '@/components/text-input'
import { Form } from '@/components/ui/form'
import { useScenarios } from '@/hooks/use-scenarios'
import { useShowcaseStore } from '@/hooks/use-showcase-store';
import { StepType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import DeleteModal from '../delete-modal'
import { DisplaySearchResults } from '../onboarding-screen/display-search-results'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { DisplayStepCredentials } from './display-step-credentials'
import { CredentialAttributeType, CredentialDefinition, CredentialDefinitionType, StepRequest, StepRequestType } from '@/openapi-types'
import { usePresentations } from '@/hooks/use-presentation'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useCredentialDefinitions } from "@/hooks/use-credentials";
import { useCredentials } from '@/hooks/use-credentials-store'
interface StepWithCredentials extends StepRequestType {
  credentials?: string[];
}

export const ProofStepEdit = () => {
  const t = useTranslations()
  const { showcaseJSON, selectedCharacter } = useShowcaseStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { screens } = usePresentations()
  const { relayerId } = useHelpersStore();
  const {selectedScenario, updateStep,selectedStep, setStepState } = usePresentationAdapter()
  const [searchResults, setSearchResults] = useState<typeof CredentialDefinition._type[]>([])
  const { data: credentials } = useCredentialDefinitions();
  const { setSelectedCredential } = useCredentials()
  const { personas } = useOnboardingAdapter()

  const currentStep = selectedScenario && selectedStep !== null ? selectedScenario.steps[selectedStep.stepIndex] as StepWithCredentials : null

  const defaultValues = {
    title: currentStep?.title || '',
    description: currentStep?.description || '',
    asset: currentStep?.asset || undefined,
  }

  const form = useForm<StepRequestType>({
    resolver: zodResolver(StepRequest),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    if (currentStep) {
      form.reset({
        title: currentStep.title,
        description: currentStep.description,
        asset: undefined,
        credentialDefinitionIdentifierType: currentStep.credentialDefinitionIdentifierType,
        credentialDefinitionIdentifier: currentStep.credentialDefinitionIdentifier,
        actions: currentStep.actions
      });
    }
  }, [currentStep, form]);

    const autoSave = debounce((data: StepRequestType) => {
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
          autoSave(value as StepRequestType)
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

  const addCredential = (credentialId: string) => {
    if (!currentStep) return;
    const existing = currentStep.credentials || [];
    if (!existing.includes(credentialId)) {
      const updated = [...existing, credentialId];
      updateStep(selectedStep?.stepIndex || 0, { ...currentStep, credentials: updated });
    }
    setSearchResults([]);
  }

  const removeCredential = (credentialId: string) => {
    if (!currentStep) return;
    const updated = (currentStep.credentials || []).filter(id => id !== credentialId);
    updateStep(selectedStep?.stepIndex || 0, { ...currentStep, credentials: updated });
    setSelectedCredential(null);
  }

  const onSubmit = (data: StepRequestType) => {
    autoSave.flush()
    if (selectedScenario === null || selectedStep === null) return


    // updateStep(selectedScenario, selectedStep, updatedStep as any)
    setStepState('no-selection')
  }

  // if (!currentStep) return null

  return (
    <>
      <StepHeader
        icon={<Monitor strokeWidth={3} />}
        title={'Edit Proof Step'}
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
          <div>
            <div className="space-y-6">
              <FormTextInput
                label="Title"
                name="title"
                register={form.register}
                error={form.formState.errors.title?.message}
                placeholder="Enter Page title"
                control={form.control}
              />

              <FormTextArea
                label="Page Content"
                name="description"
                register={form.register}
                error={form.formState.errors.description?.message}
                placeholder="Enter Page Content"
                control={form.control}
              />
            </div>

            <div className="space-y-4 h-screen">
              <h4 className="text-xl font-bold">Request Options</h4>
              <hr />

              {/* <FormTextInput
                label="Title"
                name="actions.0.proofRequest.title"
                register={form.register}
                error={form.formState.errors.actions?.title?.message}
                placeholder="Enter request title"
                control={form.control}
              />

              <FormTextArea
                label="Text"
                name="actions.0.proofRequest.text"
                register={form.register}
                error={form.formState.errors.actions?.text?.message}
                placeholder="Enter request text"
                control={form.control}
              /> */}

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
                    credentials={currentStep?.credentials as unknown as CredentialDefinitionType[]}
                    selectedCharacter={selectedCharacter}
                    selectedStep={selectedStep?.stepIndex || 0}
                    localData={{}}
                    selectedScenario={selectedStep?.scenarioIndex || 0}
                    removeCredential={removeCredential}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={() => setStepState('no-selection')}>{t('action.cancel_label')}</ButtonOutline>

            <ButtonOutline disabled={!form.formState.isDirty}>{t('action.next_label')}</ButtonOutline>
          </div>
        </form>
      </Form>
      {/* Delete Modal */}
      <DeleteModal
        isLoading={false}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={() => {
          console.log('Item Deleted')
          setIsModalOpen(false)
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
