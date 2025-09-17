'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { useTenant } from '@/providers/tenant-provider'
import { Form } from '@/components/ui/form'
import { FormTextArea, FormTextInput } from '@/components/text-input'
import { LocalFileUpload } from './local-file-upload'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { debounce } from 'lodash'
import { StepCredentialManager } from './step-credential-manager'
import {
  StepRequest,
  StepType,
  StepActionType,
  AcceptCredentialActionRequest,
  ChooseWalletActionRequest,
  SetupConnectionActionRequest,
  CredentialDefinition
} from 'bc-wallet-openapi'
import {
  basicStepSchema,
  issueStepSchema,
  walletStepFormSchema,
  connectStepSchema,
  FormData
} from '@/schemas/onboarding'
import { StepActionRequestUnion } from '@/types'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import DeleteModal from '../delete-modal'
import { useFormDirtyStore } from '@/hooks/use-form-dirty-store'
interface StepEditorFormProps {
  currentStep: StepRequest | null
  stepType: StepType
  selectedStep: { order: number, stepIndex?: number, scenarioIndex?: number } | null
  updateStep: (stepIndex: number, stepData: StepRequest) => void
  onSubmit: (data: FormData) => void
  onCancel: () => void
  toggleViewMode: () => void
  isEditMode?: boolean
  onProceed: () => void
  updateScenarios?: (slug: string) => Promise<any>
  createScenarios?: () => Promise<any>
}

export const StepEditorForm: React.FC<StepEditorFormProps> = ({
  currentStep,
  stepType,
  selectedStep,
  updateStep,
  onSubmit,
  onCancel,
  toggleViewMode,
  isEditMode = false,
  onProceed,
  updateScenarios: propUpdateScenarios,
  createScenarios: propCreateScenarios
}) => {
  const t = useTranslations()
  const router = useRouter()
  const { tenantId } = useTenant()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { setDirty, isDirty } = useFormDirtyStore()
  
  const getCurrentAction = (): StepActionRequestUnion | null => {
    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) {
      return null;
    }
    return currentStep.actions[0] as StepActionRequestUnion;
  };

  const currentAction = getCurrentAction();
  const { deleteStep, selectedScenario, personaScenarios } = useOnboardingAdapter()

  // console.log('selectedScenario',selectedScenario);

const isInvalidServiceStep = Array.from(personaScenarios).some(([_, scenarioList]) =>
  scenarioList.some((scenario) =>
    scenario.steps?.some(
      (step) =>
        step.type === "SERVICE" &&
        step.actions?.some(
          (action) =>
            "credentialDefinitionId" in action && // key must exist
            typeof action.credentialDefinitionId === "string" &&
            action.credentialDefinitionId.trim() === ""
        )
    )
  )
);


  const getSchemaForStep = () => {
    if (stepType === StepType.Service) {
      return issueStepSchema
    }

    if (!currentAction) return basicStepSchema

    switch (currentAction.actionType) {
      case StepActionType.ChooseWallet:
        return walletStepFormSchema
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
      // @ts-expect-error - database still do not persist the credentials
      credentials: currentStep?.credentials || [],
      setupTitle: '',
      setupDescription1: '',
      setupTitle2: '',
      setupDescription2: '',
      apple: '',
      android: '',
      ledgerImage: '',
      qrCodeTitle: '',
      credentialDefinitionId: '',
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

  useEffect(() => {
    if (currentStep) {
      form.reset(getDefaultValues())
      setDirty(false)
    }
  }, [currentStep, setDirty])

  const autoSave = debounce((data: FormData) => {
    if (!currentStep || !form.formState.isDirty || !selectedStep) return;
  
    performSave(data);
  }, 800);

  const performSave = (data: FormData) => {
    if (!currentStep || !selectedStep) return;

    const updatedStep: StepRequest = {
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
          case StepActionType.AcceptCredential:
            updatedActions[0] = {
              ...action,
              title: data.title,
              text: data.description,
              credentialDefinitionId: data.credentialDefinitionId,
            } as unknown as AcceptCredentialActionRequest;
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
  
    updateStep(selectedStep.order, updatedStep);
  
    setTimeout(() => {
      toast.success('Changes saved', { duration: 1000 });
      setDirty(false)
    }, 500);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        setDirty(true);
      }
    })
    return () => subscription.unsubscribe()
  }, [form, setDirty])

  const handleSave = async () => {
    if (!form.formState.isValid) {
      toast.error(t('onboarding.form_validation_error'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First save to local state
      form.handleSubmit(performSave)();
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 200));
        console.log('isEditMode',isEditMode);
      // Then save to API using passed methods
      if (isEditMode && propUpdateScenarios) {
        // Update existing scenario
        // @ts-expect-error : Slug is available
        const result = await propUpdateScenarios(selectedScenario.slug);
        console.log('result',result);
        if (result.success) {
          toast.success('Changes saved successfully');
        } else {
          toast.error(result.message || 'Error saving changes');
        }
      } else if (propCreateScenarios) {
        // Create new scenario
        const result = await propCreateScenarios();
        if (result.success) {
          toast.success('Scenario created successfully');
        } else {
          toast.error(result.message || 'Error creating scenario');
        }
      } else {
        // Just save locally if no API methods provided
        toast.success('Changes saved locally');
      }
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToScenario = () => {
    if (isDirty) {
      toast.warning(t('character.save_changes_warning'));
      return;
    }
    
    // Navigate to scenario page directly
    try {
      // @ts-expect-error : Slug is available
      if (isEditMode && selectedScenario?.slug) {
        // @ts-expect-error : Slug is available
        router.push(`/${tenantId}/showcases/${selectedScenario.slug}/scenarios`);
      } else {
        router.push(`/${tenantId}/showcases/create/scenarios`);
      }
    } catch (error) {
      console.error('Error navigating to scenarios:', error);
      toast.error('Error navigating');
    }
  };

   useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        autoSave(value as FormData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, autoSave])

  const getStepTitle = () => {
    if (currentStep?.order === 0 && !currentAction) {
      return t('onboarding.edit_character_introduction_step_title');
    }
    if (currentStep?.order === 1 && !currentAction) {
      return t('onboarding.edit_introduction_bc_wallet_step_title');
    }
    if (currentStep?.order === 5 && !currentAction) {
      return t('onboarding.edit_credential_received_step_title');
    }
    if (stepType === StepType.Service || currentAction?.actionType === StepActionType.AcceptCredential) {
      return t('onboarding.edit_credential_issuance_step_title');
    }
    if (currentAction?.actionType === StepActionType.ChooseWallet) {
      return t('onboarding.edit_install_bc_wallet_step_title');
    }
    if (currentAction?.actionType === StepActionType.SetupConnection || currentAction?.actionType === StepActionType.AriesOob) {
      return t('onboarding.edit_connect_bc_wallet_step_title');
    }
    return t('onboarding.basic_step_header_title');
  }

  const showCredentialSelection = () => {
    if (stepType === StepType.Service) {
      return true
    }
    return currentAction && currentAction.actionType === StepActionType.AcceptCredential
  }

  const getInstructionalText = () => {
    if (!currentAction && stepType !== StepType.Service) {
      if (currentStep?.order === 0) {
        return t('onboarding.meet_step_instruction');
      } else if (currentStep?.order === 1) {
        return t('onboarding.get_started_step_instruction');
      } else if (currentStep?.order === 5) { // Assuming 'You're all set' is the 6th step (index 5) and a basic step
        return t('onboarding.you_are_all_set_step_instruction');
      }
    }
    switch (currentAction?.actionType) {
      case StepActionType.ChooseWallet:
        return t('onboarding.install_wallet_step_instruction');
      case StepActionType.SetupConnection:
      case StepActionType.AriesOob:
        return t('onboarding.connect_step_instruction');
      case StepActionType.AcceptCredential:
        return t('onboarding.accept_credential_step_instruction');
      default:
        return null;
    }
  };

  const handleUpdateCredentials = (credentialId: string) => {
    if (!currentStep || !selectedStep) return;
  
    const updatedStep = {
      ...currentStep,
      credentials: credentialId,
    };

    if (credentialId && 
        currentStep.actions && 
        currentStep.actions.length > 0 && 
        currentStep.actions[0].actionType === StepActionType.AcceptCredential) {
      
      const updatedActions = [...currentStep.actions];
      const action = updatedActions[0] as AcceptCredentialActionRequest;
      
      updatedActions[0] = {
        ...action,
        credentialDefinitionId: credentialId,
      };
      
      updatedStep.actions = updatedActions;
    } else{
      const updatedActions = [...currentStep.actions];
      const action = updatedActions[0] as AcceptCredentialActionRequest;

      updatedActions[0] = {
        ...action,
        credentialDefinitionId: credentialId,
      };
      
      updatedStep.actions = updatedActions;
    }
    
    updateStep(selectedStep.order, updatedStep);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <StepHeader 
          icon={<Monitor strokeWidth={3} />} 
          title={getStepTitle()} 
          deleteTitle='Delete step'
          showDropdown={(currentStep?.order ?? 0) >= 6}
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

        <div className="space-y-6">
          {getInstructionalText() && (
            <p className="text-sm text-muted-foreground mb-4">
                {getInstructionalText()}
            </p>
          )}
          <FormTextInput
            control={form.control}
            label={t('onboarding.page_title_label')}
            name="title"
            register={form.register}
            error={form.formState.errors.title?.message}
            isMandatory={true}
            placeholder={t('onboarding.page_title_placeholder')}
          />

          <div className="space-y-2">
            <FormTextArea
              control={form.control}
              label={t('onboarding.page_description_label')}
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              isMandatory={true}
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
                if (!currentStep || !selectedStep) return;

                const updatedStep = {
                  ...currentStep,
                  title: currentStep.title,
                  description: currentStep.description,
                  asset: value || undefined,
                };

                updateStep(selectedStep.order, updatedStep);

                form.setValue('asset', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
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
            <StepCredentialManager
              currentStepCredential={currentStep?.actions[0].credentialDefinitionId}
              onUpdateCredentials={handleUpdateCredentials}
            />
          )}
        </div>


        <div className="gap-3 flex justify-between">
          <ButtonOutline onClick={() => {
            if (isDirty) {
              toast.warning(t('character.save_changes_warning'))
              return
            }
            onCancel()
          }} type="button">
            {'Help'}
          </ButtonOutline>



          <div className='flex gap-3'>
          <ButtonOutline
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={!form.formState.isValid || currentStep?.actions[0]?.credentialDefinitionId === '' || isInvalidServiceStep}
          >
            {'Proceed to Scenario'}
          </ButtonOutline>
          </div>

          </div>
      </form>
    </Form>
    <DeleteModal
      isLoading={false}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onDelete={() => {
        console.log('Step',selectedStep);
        setIsModalOpen(false)
        deleteStep(selectedStep?.order as number)
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