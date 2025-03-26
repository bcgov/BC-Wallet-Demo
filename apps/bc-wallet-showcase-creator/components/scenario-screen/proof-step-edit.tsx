'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { FormTextInput, FormTextArea } from '@/components/text-input'
import { Form } from '@/components/ui/form'
import { useScenarios } from '@/hooks/use-scenarios'
import { useShowcaseStore } from '@/hooks/use-showcase-store'
import type { ProofStepFormData } from '@/schemas/scenario'
import { proofStepSchema } from '@/schemas/scenario'
import type { ScenarioStep } from '@/types'
import { RequestType, StepType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import DeleteModal from '../delete-modal'
import { DisplaySearchResults } from '../onboarding-screen/display-search-results'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { DisplayStepCredentials } from './display-step-credentials'

export const ProofStepEdit = () => {
  const t = useTranslations()
  const { showcaseJSON, selectedCharacter } = useShowcaseStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { scenarios, selectedScenario, selectedStep, setStepState, updateStep } = useScenarios()
  const [searchResults, setSearchResults] = useState<string[]>([])

  const currentScenario = selectedScenario !== null ? scenarios[selectedScenario] : null
  const currentStep = currentScenario && selectedStep !== null ? currentScenario.steps[selectedStep] : null

  const form = useForm<ProofStepFormData>({
    resolver: zodResolver(proofStepSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (currentStep && currentStep.type === StepType.CONNECT_AND_VERIFY) {
      const proofStep = {
        ...currentStep,
        requestOptions: {
          ...currentStep.requestOptions,
          proofRequest: {
            attributes: currentStep.requestOptions.proofRequest.attributes || {},
            predicates: currentStep.requestOptions.proofRequest.predicates || {},
          },
        },
      } as ProofStepFormData

      form.reset(proofStep)
    }
  }, [currentStep, form.reset])

  const searchCredential = (value: string) => {
    setSearchResults([])
    if (!value) return

    const credentials = showcaseJSON.personas[selectedCharacter].credentials
    const search = value.toUpperCase()

    const results = Object.keys(credentials).filter(
      (credentialId) =>
        credentials[credentialId].issuer_name.toUpperCase().includes(search) ||
        credentials[credentialId].name.toUpperCase().includes(search)
    )

    setSearchResults(results)
  }

  const addCredential = (credentialId: string) => {
    setSearchResults([])
    const currentAttributes = form.getValues('requestOptions.proofRequest.attributes')

    if (!currentAttributes[credentialId]) {
      const credential = showcaseJSON.personas[selectedCharacter].credentials[credentialId]
      form.setValue(
        `requestOptions.proofRequest.attributes.${credentialId}`,
        {
          attributes: [credential.attributes[0].name],
        },
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      )
    }
  }

  const removeCredential = (credentialId: string) => {
    const formValues = form.getValues()
    const newAttributes = {
      ...formValues.requestOptions.proofRequest.attributes,
    }
    delete newAttributes[credentialId]

    form.setValue('requestOptions.proofRequest.attributes', newAttributes, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    // Remove any predicates that reference this credential
    if (formValues.requestOptions.proofRequest.predicates) {
      const newPredicates = {
        ...formValues.requestOptions.proofRequest.predicates,
      }
      Object.entries(newPredicates).forEach(([key, predicate]) => {
        if (predicate.restrictions[0] === credentialId) {
          delete newPredicates[key]
        }
      })

      form.setValue('requestOptions.proofRequest.predicates', newPredicates, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    }
  }

  const onSubmit = (data: ProofStepFormData) => {
    if (selectedScenario === null || selectedStep === null) return

    const updatedStep: ScenarioStep = {
      ...data,
      type: StepType.CONNECT_AND_VERIFY,
      requestOptions: {
        ...data.requestOptions,
        type: RequestType.OOB,
        proofRequest: {
          attributes: data.requestOptions.proofRequest.attributes,
          predicates: data.requestOptions.proofRequest.predicates || {},
        },
      },
    }

    updateStep(selectedScenario, selectedStep, updatedStep)
    setStepState('none-selected')
  }

  if (!currentStep) return null

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

              <FormTextInput
                label="Title"
                name="requestOptions.title"
                register={form.register}
                error={form.formState.errors.requestOptions?.title?.message}
                placeholder="Enter request title"
                control={form.control}
              />

              <FormTextArea
                label="Text"
                name="requestOptions.text"
                register={form.register}
                error={form.formState.errors.requestOptions?.text?.message}
                placeholder="Enter request text"
                control={form.control}
              />

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

                {currentScenario && (
                  <DisplayStepCredentials
                    selectedCharacter={selectedCharacter}
                    showcaseJSON={showcaseJSON}
                    localData={form.watch()}
                    selectedStep={selectedStep}
                    selectedScenario={selectedScenario}
                    removeCredential={removeCredential}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={() => setStepState('none-selected')}>{t('action.cancel_label')}</ButtonOutline>

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
