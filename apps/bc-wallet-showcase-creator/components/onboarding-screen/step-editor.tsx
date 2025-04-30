'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { NoSelection } from '../credentials/no-selection'
import { ErrorModal } from '../error-modal'
import Loader from '../loader'
import { StepType } from 'bc-wallet-openapi'
import { StepEditorForm } from './step-editor-form'
import { StepPreview } from './step-preview'
import { baseUrl } from '@/lib/utils'
import { useShowcase } from '@/hooks/use-showcases'

export const StepEditor = ({ showcaseSlug }: { showcaseSlug?: string }) => {
  const t = useTranslations()
  const router = useRouter()
  const [isCreatingOrUpdating, setIsCreatingOrUpdating] = useState(false)
  const [showErrorModal, setErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isViewMode, setIsViewMode] = useState(false)
  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug || '')

  const {
    steps: screens,
    selectedStep,
    setSelectedStep,
    setStepState,
    updateStep,
    createScenarios,
    updateScenarios,
    isEditMode
  } = useOnboardingAdapter(showcaseSlug)

  const currentStep = selectedStep !== null ? screens[selectedStep.order] : null
  const stepType = currentStep?.type || StepType.HumanTask

  const toggleViewMode = () => setIsViewMode(!isViewMode)

  const handleCancel = () => {
    setStepState('no-selection')
    setSelectedStep(null)
  }

  const handleSubmit = async () => {
    setIsCreatingOrUpdating(true)
    
    try {
      let result;
      
      if (isEditMode && showcaseSlug) {
        result = await updateScenarios(showcaseSlug)
        if (result.success) {
          toast.success('Scenarios updated successfully')
          router.push(`/showcases/${showcaseSlug}/scenarios`)
        } else {
          throw new Error(result.message || 'Failed to update scenarios')
        }
      } else {
        result = await createScenarios()
        if (result.success) {
          toast.success('Scenarios created successfully')
          router.push('/showcases/create/scenarios')
        } else {
          throw new Error(result.message || 'Failed to create scenarios')
        }
      }
    } catch (error) {
      console.error('Error during scenario operation:', error)
      setErrorMessage((error as Error).message || 'An unknown error occurred')
      setErrorModal(true)
    } finally {
      setIsCreatingOrUpdating(false)
    }
  }

  if (selectedStep === null) {
    return <NoSelection text={t('onboarding.no_step_selected_message')} />
  }

  if (isViewMode && currentStep) {
    return <StepPreview 
      currentStep={currentStep} 
      toggleViewMode={toggleViewMode} 
      baseUrl={baseUrl} 
    />
  }

  if (isCreatingOrUpdating) {
    return <Loader text={isEditMode ? "Updating Scenario" : "Creating Scenario"} />
  }

  if (showErrorModal) {
    return <ErrorModal 
      errorText={errorMessage || "Unknown error occurred"} 
      setShowModal={setErrorModal} 
    />
  }

  return (
    <StepEditorForm
      currentStep={currentStep}
      stepType={stepType}
      selectedStep={selectedStep}
      updateStep={updateStep}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      toggleViewMode={toggleViewMode}
      isEditMode={isEditMode}
    />
  )
}