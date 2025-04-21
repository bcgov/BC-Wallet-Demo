'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, Edit } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormTextArea, FormTextInput } from '@/components/text-input'
import { LocalFileUpload } from './local-file-upload'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { useOnboarding, useCreateScenario } from '@/hooks/use-onboarding'
import { useRouter } from '@/i18n/routing'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { NoSelection } from '../credentials/no-selection'
import { ErrorModal } from '../error-modal'
import Loader from '../loader'
import { useCredentials } from '@/hooks/use-credentials-store'
import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { debounce } from 'lodash'
import { DisplaySearchResults } from './display-search-results'
import { DisplayAddedCredentials } from './display-added-credentials'
import Image from 'next/image'
import {
  CredentialDefinition,
  StepRequest,
  StepType,
  StepActionType,
  StepActionRequest,
  AriesOOBActionRequest,
  AcceptCredentialActionRequest,
  SetupConnectionActionRequest,
  ChooseWalletActionRequest,
  ButtonActionRequest,
  StepAction,
} from 'bc-wallet-openapi'
import { sampleScenario, StepRequestUIActionTypes } from '@/lib/steps'
import {
  basicStepSchema,
  issueStepSchema,
  walletStepSchema,
  connectStepSchema,
  BasicStepFormData,
  IssueStepFormData,
  WalletStepFormData,
  ConnectStepFormData,
} from '@/schemas/onboarding'
import { z } from 'zod'

export const StepEditor = () => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateScenario()
  const { setScenarioIds, showcase } = useShowcaseStore()
  const { issuerId } = useHelpersStore()
  const { personas } = useOnboardingAdapter()
  const { setSelectedCredential, selectedCredential } = useCredentials()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showErrorModal, setErrorModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)

  const { screens, selectedStep, setSelectedStep, setStepState, updateStep, removeStep } = useOnboarding()

  const currentStep = selectedStep !== null ? (screens[selectedStep] as StepRequestUIActionTypes) : null
  const stepType = currentStep?.type || StepType.HumanTask

  const getCurrentAction = (): StepActionRequest | null => {
    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) {
      return null
    }
    return currentStep.actions[0] as StepActionRequest
  }

  const currentAction = getCurrentAction()

  const getSchemaForStep = () => {
    if (stepType === StepType.Service) {
      return issueStepSchema
    }

    if (!currentAction) return basicStepSchema

    switch (currentAction.actionType) {
      case StepActionType.ChooseWallet:
        return z.object({
          title: walletStepSchema.shape.title || z.string().min(1, 'Title is required'),
          description: walletStepSchema.shape.description || z.string().min(1, 'Description is required'),
          asset: z.any().optional(),
          setupTitle1: z.string().optional(),
          setupDescription1: z.string().optional(),
          setupTitle2: z.string().optional(),
          setupDescription2: z.string().optional(),
          apple: z.string().optional(),
          android: z.string().optional(),
          ledgerImage: z.string().optional(),
        })
      case StepActionType.SetupConnection:
      case StepActionType.AriesOob:
        return connectStepSchema
      case StepActionType.AcceptCredential:
        return issueStepSchema
      case StepActionType.ShareCredential:
      case StepActionType.Button:
      default:
        return basicStepSchema
    }
  }

  const getDefaultValues = () => {
    const baseDefaults = {
      title: currentStep?.title || '',
      description: currentStep?.description || '',
      asset: currentStep?.asset || '',
      credentials: currentStep?.credentials || [],
    }

    if (!currentAction) return baseDefaults

    switch (currentAction.actionType) {
      case StepActionType.ChooseWallet:
        return {
          ...baseDefaults,
          setupTitle1: '1. Download BC Wallet on your phone',
          setupDescription1:
            "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
          setupTitle2: '2. Complete the setup',
          setupDescription2: 'Complete the onboarding process in the app.',
          apple: 'https://apps.apple.com/ca/app/bc-wallet/id6444150782',
          android: 'https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet',
          ledgerImage:
            'https://play-lh.googleusercontent.com/eEYm6AaDGNFcE1riIW7W-R8RJvDgVVakjr2gnxdeUOngsb9EZWZ9p2zPDBHybiS0lUJu=w240-h480-rw',
        }
      case StepActionType.SetupConnection:
      case StepActionType.AriesOob:
        return {
          ...baseDefaults,
        }
      default:
        return baseDefaults
    }
  }

  type FormData = BasicStepFormData | IssueStepFormData | WalletStepFormData | ConnectStepFormData

  const form = useForm<FormData>({
    resolver: zodResolver(getSchemaForStep()),
    defaultValues: getDefaultValues(),
    mode: 'all',
  })

  const toggleViewMode = () => {
    setIsViewMode(!isViewMode)
  }

  useEffect(() => {
    if (currentStep) {
      form.reset(getDefaultValues())
      setIsViewMode(false)
    }
  }, [currentStep, form])

  const autoSave = debounce((data: any) => {
    if (!currentStep || !form.formState.isDirty) return

    const updatedStep: StepRequestUIActionTypes = {
      ...currentStep,
      title: data.title,
      description: data.description,
      asset: data.asset || undefined,
      type: currentStep.type || StepType.HumanTask,
      order: currentStep.order || 0,
      actions: currentStep.actions || [],
    }

    updateStep(selectedStep || 0, updatedStep as StepRequest)

    setTimeout(() => {
      toast.success('Changes saved', { duration: 1000 })
    }, 500)
  }, 800)

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        autoSave(value)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, autoSave])

  const handleSubmit = async (data: FormData) => {
    autoSave.flush()
    const personaScenarios = personas.map((persona) => {
      const scenarioForPersona = JSON.parse(JSON.stringify(sampleScenario))

      let actionData:
        | AriesOOBActionRequest
        | AcceptCredentialActionRequest
        | SetupConnectionActionRequest
        | ChooseWalletActionRequest
        | ButtonActionRequest
        | null = null

      if (currentAction) {
        switch (currentAction.actionType) {
          case StepActionType.AcceptCredential:
            actionData = {
              title: currentAction.title || 'Accept Credential',
              actionType: StepActionType.AcceptCredential,
              text: currentAction.text || 'Accept this credential',
              credentialDefinitionId:
                selectedCredential?.id || (currentAction as AcceptCredentialActionRequest).credentialDefinitionId,
            } as AcceptCredentialActionRequest
            break
          case StepActionType.AriesOob:
            actionData = {
              title: currentAction.title || 'Connect with Issuer',
              actionType: StepActionType.AriesOob,
              text: currentAction.text || 'Scan this QR code to connect',
              proofRequest: (currentAction as AriesOOBActionRequest).proofRequest || {
                attributes: {},
                predicates: {},
              },
              credentialDefinitionId: (currentAction as AriesOOBActionRequest).credentialDefinitionId || '',
            } as AriesOOBActionRequest
            break
          case StepActionType.SetupConnection:
            actionData = {
              title: currentAction.title || 'Setup Connection',
              actionType: StepActionType.SetupConnection,
              text: currentAction.text || 'Set up a connection with the issuer',
            } as SetupConnectionActionRequest
            break
          case StepActionType.ChooseWallet:
            actionData = {
              title: currentAction.title || 'Choose Wallet',
              actionType: StepActionType.ChooseWallet,
              text: currentAction.text || 'Choose a wallet to continue',
            } as ChooseWalletActionRequest
            break
          case StepActionType.Button:
            actionData = {
              title: currentAction.title || 'Continue',
              actionType: StepActionType.Button,
              text: currentAction.text || 'Click to continue',
              goToStep: (currentAction as ButtonActionRequest).goToStep,
            } as ButtonActionRequest
            break
          default:
            actionData = {
              title: 'Default Action',
              actionType: StepActionType.Button,
              text: 'Continue to next step',
            } as ButtonActionRequest
        }
      } else if (stepType === StepType.Service) {
        actionData = {
          title: 'Accept Credential',
          actionType: StepActionType.AcceptCredential,
          text: 'Accept this credential',
          credentialDefinitionId: selectedCredential?.id,
          connectionId: '',
        } as AcceptCredentialActionRequest
      }

      scenarioForPersona.personas = [persona.id]
      scenarioForPersona.issuer = issuerId

      scenarioForPersona.steps = [
        ...screens.map((screen, index) => {
          let actions = screen.actions?.length ? screen.actions : []

          if (screen.type === StepType.Service && !screen.actions?.length && actionData) {
            // @ts-ignore
            actions = [actionData]
          }

          return {
            title: screen.title,
            description: screen.description,
            asset: screen.asset || undefined,
            type: screen.type || StepType.HumanTask,
            order: index,
            screenId: 'INFO',
            actions: actions as StepAction[],
          }
        }),
      ]

      const currentStepExists = scenarioForPersona.steps.some(
        (step: StepRequest) => step.title === data.title && step.description === data.description,
      )

      if (!currentStepExists && currentStep) {
        scenarioForPersona.steps.push({
          title: data.title,
          description: data.description,
          asset: data.asset || undefined,
          type: stepType,
          order: currentStep.order || scenarioForPersona.steps.length,
          actions: currentStep.actions || [],
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
      } catch (error) {
        console.error('Error creating scenario:', error)
        setErrorModal(true)
        return
      }
    }

    setScenarioIds(scenarioIds)
    router.push(`/showcases/create/scenarios`)
  }

  const handleCancel = () => {
    form.reset()
    setStepState('no-selection')
    setSelectedStep(null)
  }

  const searchCredential = (searchText: string) => {
    setSearchResults([])
    if (!searchText) return

    const searchUpper = searchText.toUpperCase()

    if (!Array.isArray(credentials?.credentialDefinitions)) {
      console.error('Invalid credential data format')
      return
    }

    const results = credentials.credentialDefinitions.filter((cred: CredentialDefinition) =>
      cred.name.toUpperCase().includes(searchUpper),
    )

    setSearchResults(results)
  }

  const addCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return
    const existing = currentStep.credentials || []
    if (!existing.includes(credential)) {
      const updated = [...existing, credential]
      updateStep(selectedStep || 0, { ...currentStep, credentials: updated } as StepRequest)
    }
    setSearchResults([])
  }

  const removeCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return
    const updated = (currentStep.credentials || []).filter((cred) => cred !== credential)
    updateStep(selectedStep || 0, { ...currentStep, credentials: updated } as StepRequest)
    setSelectedCredential(null)
  }

  if (selectedStep === null) {
    return <NoSelection text={t('onboarding.no_step_selected_message')} />
  }

  if (isViewMode && currentStep) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between mt-3">
          <div>
            <p className="text-foreground text-sm">{t('onboarding.section_title')}</p>
            <h3 className="text-2xl font-bold text-foreground">{t('onboarding.details_step_header_title')}</h3>
          </div>
          <Button variant="outline" onClick={toggleViewMode} className="flex items-center gap-2">
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
                <Image
                  src={currentStep.asset}
                  alt="Step icon"
                  className="w-full object-cover"
                  width={128}
                  height={128}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isPending || loading) {
    return <Loader text="Creating Step" />
  }

  if (showErrorModal) {
    return <ErrorModal errorText="Unknown error occurred" setShowModal={setErrorModal} />
  }

  const getStepTitle = () => {
    if (stepType === StepType.Service) {
      return t('onboarding.issue_step_header_title')
    }

    if (!currentAction) return t('onboarding.basic_step_header_title')

    switch (currentAction.actionType) {
      case StepActionType.ChooseWallet:
        return t('onboarding.wallet_step_header_title')
      case StepActionType.SetupConnection:
      case StepActionType.AriesOob:
        return t('onboarding.connect_step_header_title')
      case StepActionType.AcceptCredential:
        return t('onboarding.issue_step_header_title')
      default:
        return t('onboarding.basic_step_header_title')
    }
  }

  const showCredentialSelection = () => {
    if (stepType === StepType.Service) {
      return true
    }
    return currentAction && currentAction.actionType === StepActionType.AcceptCredential
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <StepHeader icon={<Monitor strokeWidth={3} />} title={getStepTitle()} showDropdown={false} />

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
              text={t('onboarding.icon_label')}
              element="asset"
              existingAssetId={form.watch('asset')}
              handleLocalUpdate={(_, value) => {
                if (!currentStep) return

                const updatedStep = {
                  ...currentStep,
                  title: currentStep.title,
                  description: currentStep.description,
                  asset: value || undefined,
                }

                updateStep(selectedStep || 0, updatedStep as StepRequest)

                form.setValue('asset', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
            />
          </div>

          {currentAction && currentAction.actionType === StepActionType.ChooseWallet && (
            <>
              <div className="my-6">
                <hr className="border-b border-foreground/10" />
              </div>
              <div className="space-y-2">
                <FormTextInput
                  control={form.control}
                  label="App Store URL"
                  name="apple"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the App Store URL"
                />
                <FormTextInput
                  control={form.control}
                  label="Google Play Store URL"
                  name="android"
                  readOnly={true}
                  disabled={true}
                  register={form.register}
                  placeholder="Enter the Google Play Store URL"
                />
              </div>

              <div className="space-y-2">
                <FormTextInput
                  control={form.control}
                  label="Step Title"
                  name="setupTitle1"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the title for this step"
                />
                <FormTextArea
                  control={form.control}
                  label="Step Description"
                  name="setupDescription1"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the description for this step"
                />
              </div>

              <div className="space-y-2">
                <FormTextInput
                  control={form.control}
                  label="Step Title"
                  name="setupTitle2"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the title for this step"
                />
                <FormTextArea
                  control={form.control}
                  label="Step Description"
                  name="setupDescription2"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the description for this step"
                />
              </div>
            </>
          )}

          {currentAction && currentAction.actionType === StepActionType.SetupConnection && (
            <>
              <div className="my-6">
                <hr className="border-b border-foreground/10" />
                <p className="mt-4 text-lg font-semibold">Connection Setup</p>
                <p className="text-sm text-muted-foreground mb-2">
                  This step will create a connection using a QR code that can be scanned with a mobile wallet.
                </p>
              </div>
              <div className="my-6">
                <hr className="border-b border-foreground/10" />
              </div>
              <div className="space-y-2">
                <FormTextInput
                  control={form.control}
                  label={t('onboarding.qrCode_label')}
                  name="qrCodeTitle"
                  register={form.register}
                  readOnly={true}
                  disabled={true}
                  placeholder="Enter the title for this step"
                />
              </div>
            </>
          )}

          {showCredentialSelection() && (
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
                  if (!currentStep) return

                  updateStep(selectedStep || 0, {
                    ...currentStep,
                    credentials: updated,
                    title: currentStep.title,
                    description: currentStep.description,
                  } as StepRequest)
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t flex justify-end gap-3">
          <ButtonOutline onClick={handleCancel} type="button">
            {t('action.cancel_label')}
          </ButtonOutline>

          <ButtonOutline type="button" onClick={toggleViewMode}>
            {t('action.preview_label')}
          </ButtonOutline>

          <ButtonOutline
            type="button"
            onClick={() => form.handleSubmit(handleSubmit)()}
            disabled={!form.formState.isValid}
          >
            {t('action.next_label')}
          </ButtonOutline>
        </div>
      </form>
    </Form>
  )
}
