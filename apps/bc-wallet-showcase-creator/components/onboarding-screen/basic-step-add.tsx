'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormTextArea, FormTextInput } from '@/components/text-input'
import { Edit, Monitor } from 'lucide-react'
import { useOnboarding, useCreateScenario } from '@/hooks/use-onboarding'
import { BasicStepFormData } from '@/schemas/onboarding'
import { basicStepSchema } from '@/schemas/onboarding'
import { LocalFileUpload } from './local-file-upload'
import { useTranslations } from 'next-intl'
import StepHeader from '../step-header';
import ButtonOutline from '../ui/button-outline'
import Image from 'next/image'
import { useRouter } from '@/i18n/routing'
import { ErrorModal } from '../error-modal'
import Loader from '../loader';
import { useShowcaseStore } from '@/hooks/use-showcases-store';
import { toast } from 'sonner';
import { sampleScenario, StepRequestUIActionTypes } from '@/lib/steps'
import { NoSelection } from '../credentials/no-selection'
import { debounce } from 'lodash';
import { useHelpersStore } from '@/hooks/use-helpers-store';
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useCredentials } from '@/hooks/use-credentials-store'
import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { StepType } from '@/types'
import { DisplaySearchResults } from './display-search-results'
import { DisplayAddedCredentials } from './display-added-credentials'
import { CredentialDefinition, StepRequest } from 'bc-wallet-openapi'

export const BasicStepAdd = () => {
  const t = useTranslations()

  const {
    screens,
    selectedStep,
    setSelectedStep,
    setStepState,
    stepState,
    updateStep,
  } = useOnboarding();

  const router = useRouter();
  const { mutateAsync, isPending } = useCreateScenario();
  const currentStep = selectedStep !== null ? screens[selectedStep] as StepRequestUIActionTypes : null;
  const { setScenarioIds } = useShowcaseStore();
  const { issuerId } = useHelpersStore();
  const { personas } = useOnboardingAdapter()
  const { setSelectedCredential,selectedCredential } = useCredentials()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([]);
  const { data: credentials } = useCredentialDefinitions();

  const isEditMode = stepState === 'editing-basic'
  const [showErrorModal, setErrorModal] = useState(false)

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
      form.reset({
        title: currentStep.title,
        description: currentStep.description,
        asset: currentStep.asset || '',
      })
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

    updateStep(selectedStep || 0, updatedStep as StepRequest)

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

  const onSubmit = async (data: BasicStepFormData) => {
    autoSave.flush()
    const personaScenarios = personas.map((persona) => {
      const scenarioForPersona = JSON.parse(JSON.stringify(sampleScenario))

      const ActionDataWithCredential = {
        title: "example_title",
        actionType: "ACCEPT_CREDENTIAL",
        text: "example_text",
        credentialDefinitionId: selectedCredential?.id
      }
      scenarioForPersona.personas = [persona.id]
      scenarioForPersona.issuer = issuerId

      scenarioForPersona.steps = [
        ...screens.map((screen, index) => ({
          title: screen.title,
          description: screen.description,
          asset: screen.asset || undefined,
          type: screen.type || 'HUMAN_TASK',
          order: index,
          screenId:'INFO',
          actions: screen?.type === 'SERVICE' ? [ActionDataWithCredential] : [],
        })),
      ]

      const currentStepExists = scenarioForPersona.steps.some(
        (step: any) => step.title === data.title && step.description === data.description
      )

      if (!currentStepExists) {
        scenarioForPersona.steps.push({
          title: data.title,
          description: data.description,
          asset: data.asset || undefined,
          type: 'HUMAN_TASK',
          order: currentStep?.order || scenarioForPersona.steps.length,
          actions: [],
        })
      }

      return scenarioForPersona
    })

    const scenarioIds = []

    for (const scenario of personaScenarios) {
      try {
        const result = await mutateAsync(scenario)
        if (result && result.issuanceScenario) {
          scenarioIds.push(result.issuanceScenario.id)
          toast.success(`Scenario created for ${scenario.personas[0]?.name || 'persona'}`)
        } else {
          console.error('Invalid response format:', result)
          throw new Error('Invalid response format')
        }
        toast.success(`Scenario created for ${scenario.personas[0]?.name || 'persona'}`)
      } catch (error) {
        console.error('Error creating scenario:', error)
        setErrorModal(true)
        return // Stop if there's an error
      }
    }

    setScenarioIds(scenarioIds)
    router.push(`/showcases/create/scenarios`)
  }

  const searchCredential = (searchText: string) => {
    setSearchResults([]);
    if (!searchText) return;

    const searchUpper = searchText.toUpperCase();

    if (!Array.isArray(credentials?.credentialDefinitions)) {
      console.error("Invalid credential data format");
      return;
    }

    const results = credentials.credentialDefinitions.filter((cred: CredentialDefinition) =>
      cred.name.toUpperCase().includes(searchUpper)
    );

    setSearchResults(results);
  };

  const addCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return;
    const existing = currentStep.credentials || [];
    if (!existing.includes(credential)) {
      const updated = [...existing, credential];
      updateStep(selectedStep || 0, { ...currentStep, credentials: updated } as StepRequestUIActionTypes);
    }
    setSearchResults([]);
  };

  const removeCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return;
    // @ts-expect-error: TODO: fix this
    const updated = (currentStep.credentials || []).filter((id: string) => id !== credential.id);
    updateStep(selectedStep || 0, { ...currentStep, credentials: updated } as StepRequestUIActionTypes);
    setSelectedCredential(null);
  };

  const handleCancel = () => {
    form.reset()
    setStepState('no-selection')
    setSelectedStep(null)
  }

  if (selectedStep === null) {
    return <NoSelection text={t('onboarding.no_step_selected_message')} />
  }

  if (!isEditMode && currentStep) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between mt-3">
          <div>
            <p className="text-foreground text-sm">{t('onboarding.section_title')}</p>
            <h3 className="text-2xl font-bold text-foreground">{t('onboarding.details_step_header_title')}</h3>
          </div>
          <Button variant="outline" onClick={() => setStepState('editing-basic')} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {t('action.edit_label')}
          </Button>
        </div>
        <hr />

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.page_title_label')}</h4>
            <p className="text-lg">{currentStep.title}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.page_description_label')}</h4>
            <p className="text-lg whitespace-pre-wrap">{currentStep.description}</p>
          </div>

          {currentStep.asset && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.icon_label')}</h4>
              <div className="w-32 h-32 rounded-lg overflow-hidden border">
                <Image src={currentStep.asset} alt="Step icon" className="w-full object-cover" width={128} height={128} />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isPending) {
    return <Loader text="Creating Step" />
  }

  if (showErrorModal) {
    return <ErrorModal errorText="Unknown error occurred" setShowModal={setErrorModal} />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <StepHeader
          icon={<Monitor strokeWidth={3} />}
          title={currentStep?.type == StepType.SERVICE ? t('onboarding.issue_step_header_title') : t('onboarding.basic_step_header_title')}
          showDropdown={false}
        />
        <div className="space-y-6">
          <FormTextInput
            control={form.control}
            label={t('onboarding.page_title_label')}
            name="title"
            register={form.register}
            error={form.formState.errors.title?.message}
            placeholder={t('onboarding.page_title_placeholder')}
          />

          <div className="space-y-2">
            <FormTextArea
              control={form.control}
              label={t('onboarding.page_description_label')}
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              placeholder={t('onboarding.page_description_placeholder')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
          <LocalFileUpload
              text={t("onboarding.icon_label")}
              element="asset"
              existingAssetId={form.watch("asset")}
              handleLocalUpdate={(_, value) => {
                if (!currentStep) return;

                const updatedStep1 = {
                  ...currentStep,
                  title: currentStep.title,
                  description: currentStep.description,
                  asset: value || undefined,
                  // credentials: data.credentials || [],
                };
                updateStep(selectedStep || 0, updatedStep1);

                form.setValue("asset", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
            />
          </div>
          {currentStep?.type == StepType.SERVICE && (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{t('onboarding.add_your_credential_label')}</p>
                <hr className="border border-black" />
              </div>

              <div className="mt-6">
                <p className="text-md font-bold">{t('onboarding.search_credential_label')}</p>
                <div className="flex flex-row justify-center items-center my-4">
                  <div className="relative w-full">
                    <input
                      className="dark:text-dark-text dark:bg-dark-input rounded pl-2 pr-10 mb-2 w-full border"
                      placeholder={t('onboarding.search_credential_placeholder')}
                      type="text"
                      onChange={(e) => searchCredential(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DisplaySearchResults searchResults={searchResults} addCredential={addCredential} />

              <DisplayAddedCredentials
                credentials={currentStep?.credentials as unknown as CredentialDefinition[]}
                removeCredential={removeCredential}
                updateCredentials={(updated) => {
                  if (currentStep?.title && currentStep?.description) {
                    updateStep(selectedStep || 0, {
                      ...currentStep,
                      // @ts-expect-error: TODO: fix this
                      credentials: updated as unknown as string[],
                      title: currentStep.title,
                      description: currentStep.description,
                    });
                  }
                }}
              />
            </div>
          )}
        </div>
        <div className="mt-auto pt-4 border-t flex justify-end gap-3">
          <ButtonOutline onClick={handleCancel} type="button">
            {t('action.cancel_label')}
          </ButtonOutline>

          <ButtonOutline type="button" disabled={!form.formState.isValid} onClick={() => form.handleSubmit(onSubmit)()}>
            {t('action.next_label')}
          </ButtonOutline>
        </div>
      </form>
    </Form>
  )
}
