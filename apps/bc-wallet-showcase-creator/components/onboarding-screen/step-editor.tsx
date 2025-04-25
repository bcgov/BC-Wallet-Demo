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
import { useCreateScenario } from '@/hooks/use-onboarding'
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
  AcceptCredentialActionRequest,
  ChooseWalletActionRequest,
  SetupConnectionActionRequest,
} from 'bc-wallet-openapi'
import { sampleScenario, StepRequestUIActionTypes } from '@/lib/steps'
import {
  basicStepSchema,
  issueStepSchema,
  walletStepSchema,
  connectStepSchema,
  FormData
} from '@/schemas/onboarding'
import { z } from 'zod'
import { StepActionRequestUnion } from '@/types'
import { baseUrl } from '@/lib/utils'

export const StepEditor = ({ showcaseSlug }: { showcaseSlug?: string }) => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateScenario()
  const { setScenarioIds } = useShowcaseStore()
  const { issuerId } = useHelpersStore()
  const { setSelectedCredential, selectedCredential } = useCredentials()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions()
  const [showErrorModal, setErrorModal] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)

  const { steps: screens, selectedStep, setSelectedStep, setStepState, updateStep, personas } = useOnboardingAdapter(showcaseSlug)

  const currentStep = selectedStep !== null ? (screens[selectedStep.order] as StepRequestUIActionTypes) : null
  const stepType = currentStep?.type || StepType.HumanTask

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
          setupTitle: z.string().optional(),
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

  const getCurrentAction = (): StepActionRequestUnion | null => {
    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) {
      return null;
    }
    return currentStep.actions[0] as StepActionRequestUnion;
  };

  const currentAction = getCurrentAction();

  const getDefaultValues = () => {
    const baseDefaults = {
      title: currentStep?.title || '',
      description: currentStep?.description || '',
      asset: currentStep?.asset || '',
      credentials: currentStep?.credentials || [],
    };
  
    if (!currentAction) return baseDefaults
  
    switch (currentAction.actionType) {
      case StepActionType.ChooseWallet:
        return {
          ...baseDefaults,
          // @ts-expect-error - database still do not persist the setupTitle
          setupTitle: currentAction.setupTitle || '1. Download BC Wallet on your phone',
          // @ts-expect-error - database still do not persist the setupDescription1
          setupDescription1: currentAction.setupDescription1 || 
            "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
          // @ts-expect-error - database still do not persist 
          setupTitle2: currentAction.setupTitle2 || '2. Complete the setup',
          // @ts-expect-error - database still do not persist the setupDescription2
          setupDescription2: currentAction.setupDescription2 || 'Complete the onboarding process in the app.',
          // @ts-expect-error - database still do not persist the apple
          apple: currentAction.apple || 'https://apps.apple.com/ca/app/bc-wallet/id6444150782',
          // @ts-expect-error - database still do not persist the android
          android: currentAction.android || 'https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet',
          // @ts-expect-error - database still do not persist the ledgerImage
          ledgerImage: currentAction.ledgerImage ||
            'https://play-lh.googleusercontent.com/eEYm6AaDGNFcE1riIW7W-R8RJvDgVVakjr2gnxdeUOngsb9EZWZ9p2zPDBHybiS0lUJu=w240-h480-rw',
        };
      
      case StepActionType.SetupConnection:
        return {
          ...baseDefaults,
          // @ts-expect-error - database still do not persist the qrCodeTitle
          qrCodeTitle: currentAction.qrCodeTitle || 'Scan this QR code with your BC Wallet app',
        };
      case StepActionType.AriesOob:
        return {
          ...baseDefaults,
        };
      case StepActionType.AcceptCredential:
        return {
          ...baseDefaults,
          credentialDefinitionId: currentAction.credentialDefinitionId || '',
        };
        
      case StepActionType.Button:
        return {
          ...baseDefaults,
        };
        
      default:
        return baseDefaults;
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(getSchemaForStep()),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
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

  const autoSave = debounce((data: FormData) => {
    if (!currentStep || !form.formState.isDirty) return;
  
    const updatedStep: StepRequestUIActionTypes = {
      ...currentStep,
      title: data.title,
      description: data.description,
      asset: data.asset || undefined,
      type: currentStep.type || StepType.HumanTask,
      order: currentStep.order || 0,
    };
  
    if (currentStep.actions && currentStep.actions.length > 0) {
      const updatedActions = [...currentStep.actions];
      const action = updatedActions[0] as StepActionRequestUnion;
      
      if (action) {
        switch (action.actionType) {
          case StepActionType.ChooseWallet:
            updatedActions[0] = {
              ...action,
              title: data.title,
              text: data.description,
              setupTitle: data.setupTitle,
              setupDescription1: data.setupDescription1,
              setupTitle2: data.setupTitle2,
              setupDescription2: data.setupDescription2,
              apple: data.apple,
              android: data.android,
              ledgerImage: data.ledgerImage,
            } as unknown as ChooseWalletActionRequest;
            break;
            
          case StepActionType.SetupConnection:
            updatedActions[0] = {
              ...action,
              title: data.title,
              text: data.description,
              qrCodeTitle: data.qrCodeTitle,
            } as unknown as SetupConnectionActionRequest;
            break;
            
          case StepActionType.AriesOob:
            updatedActions[0] = {
              ...action,
              title: data.title,
              text: data.description,
            };
            break;
            
          default:
            updatedActions[0] = {
              ...action,
              title: data.title,
              text: data.description,
            };
        }
      }
      
      updatedStep.actions = updatedActions;
    }
  
    updateStep(selectedStep?.order || 0, updatedStep as StepRequest);
  
    setTimeout(() => {
      toast.success('Changes saved', { duration: 1000 });
    }, 500);
  }, 800);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        autoSave(value as FormData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, autoSave])

  const handleSubmit = async (data: FormData) => {
    autoSave.flush()
    
    const credentialId = selectedCredential?.id || 
      (currentStep?.credentials && currentStep.credentials.length > 0 ? currentStep.credentials[0].id : undefined);
    
    const ensureCredentialId = (actions: StepActionRequestUnion[]): StepActionRequestUnion[] => {
      return actions.map(action => {
        if (action.actionType === StepActionType.AcceptCredential) {
          const currentCredId = (action as AcceptCredentialActionRequest).credentialDefinitionId;
          
          if (!currentCredId && !credentialId) {
            toast.error("Please select a credential before continuing");
            throw new Error("Missing credential ID");
          }
          
          return {
            ...action,
            credentialDefinitionId: currentCredId || credentialId
          };
        }
        return action;
      });
    };
    
    try {
      const personaScenarios = personas.map((persona) => {
        const scenarioForPersona = JSON.parse(JSON.stringify(sampleScenario));
        
        scenarioForPersona.personas = [persona.id];
        scenarioForPersona.issuer = issuerId;
        
        scenarioForPersona.steps = screens.map((screen, index) => {
          let actions = screen.actions as StepActionRequestUnion[] || [];
          
          if (actions.length > 0) {
            try {
              actions = ensureCredentialId(actions);
            } catch (error) {
              return null;
            }
          }
          
          return {
            title: screen.title,
            description: screen.description,
            asset: screen.asset || undefined,
            type: screen.type || StepType.HumanTask,
            order: index,
            screenId: 'INFO',
            actions: actions,
          };
        }).filter(Boolean);
        
        if (scenarioForPersona.steps.length !== screens.length) {
          return null;
        }
        
        const currentStepExists = scenarioForPersona.steps.some(
          (step: StepRequest) => 
            step.title === data.title && 
            step.description === data.description
        );
        
        if (!currentStepExists && currentStep) {
          let currentActions = currentStep.actions || [];
          
          if (currentActions.length > 0) {
            try {
              currentActions = ensureCredentialId(currentActions as StepActionRequestUnion[]);
            } catch (error) {
              return null;
            }
          }
          
          scenarioForPersona.steps.push({
            title: data.title,
            description: data.description,
            asset: data.asset || undefined,
            type: currentStep.type || StepType.HumanTask,
            order: currentStep.order || scenarioForPersona.steps.length,
            actions: currentActions as StepActionRequestUnion[],
          });
        }
        
        return scenarioForPersona;
      }).filter(Boolean);
      
      if (personaScenarios.length === 0) {
        return;
      }
      
      const scenarioIds = [];
      
      for (const scenario of personaScenarios) {
        try {
          const result = await mutateAsync(scenario);
          if (result && result.issuanceScenario) {
            scenarioIds.push(result.issuanceScenario.id);
            toast.success(`Scenario created for ${scenario.personas[0]?.name || 'persona'}`);
          } else {
            console.error('Invalid response format:', result);
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('Error creating scenario:', error);
          setErrorModal(true);
          return;
        }
      }
      
      setScenarioIds(scenarioIds);
      router.push(`/showcases/create/scenarios`);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

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
      updateStep(selectedStep?.order || 0, { ...currentStep, credentials: updated } as StepRequest)
    }
    setSearchResults([])
  }

  const removeCredential = (credential: CredentialDefinition) => {
    if (!currentStep) return
    const updated = (currentStep.credentials || []).filter((cred) => cred !== credential)
    updateStep(selectedStep?.order || 0, { ...currentStep, credentials: updated } as StepRequest)
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
                  src={`${baseUrl}/assets/${currentStep.asset}/file` || '/assets/no-image.jpg'}
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

  if (isPending) {
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

                updateStep(selectedStep?.order || 0, updatedStep as StepRequest)

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
                  name="setupTitle"
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

                  updateStep(selectedStep?.order || 0, {
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
