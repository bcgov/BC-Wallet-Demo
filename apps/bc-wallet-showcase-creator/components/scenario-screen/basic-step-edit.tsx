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
import { useCreatePresentation, usePresentations } from '@/hooks/use-presentation'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { BasicStepFormData, basicStepSchema } from '@/schemas/onboarding'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { PresentationScenarioRequest } from 'bc-wallet-openapi'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { LocalFileUpload } from './local-file-upload'
import { ErrorModal } from '../error-modal'

export const BasicStepEdit = () => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync } = useCreatePresentation()
  const { setScenarioIds } = useShowcaseStore()
  const { selectedScenario, updateStep, selectedStep, setStepState, deleteStep } =
    usePresentationAdapter()
  const { personaScenarios } = usePresentationCreation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showErrorModal, setErrorModal] = useState(false)

  const currentStep = selectedScenario && selectedStep !== null ? selectedScenario.steps[selectedStep.stepIndex] : null

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

  const onSubmit = async (data: BasicStepFormData) => {
    autoSave.flush()

    const mappedScenarios = Array.from(personaScenarios.values()).flatMap((scenarios) =>
      scenarios.map((scenario) => ({
        ...scenario,
        steps: scenario.steps.map((step, index) => ({
          ...step,
          order: index,
          asset: step.asset || undefined,
        })),
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
            {form.formState.errors.asset && (
              <p className="text-sm text-destructive">{form.formState.errors.asset.message}</p>
            )}
          </div>

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
