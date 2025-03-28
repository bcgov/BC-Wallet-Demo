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
import { usePresentations } from '@/hooks/use-presentation'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { sampleAction, sampleScenario } from '@/lib/steps'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { BasicStepFormData, basicStepSchema } from '@/schemas/onboarding'

export const BasicStepEdit = () => {
  const t = useTranslations()
  const { personas } = useOnboardingAdapter()
  const { relayerId } = useHelpersStore()
  const { screens} = usePresentations()
  const {selectedScenario, updateStep, selectedStep, setStepState, deleteStep } = usePresentationAdapter()

  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const onSubmit = (data: BasicStepFormData) => {
    autoSave.flush()
    const personaScenarios = personas.map((persona) => {
          const scenarioForPersona = JSON.parse(JSON.stringify(sampleScenario))
          scenarioForPersona.personas = [persona.id]
          scenarioForPersona.relyingParty = relayerId
    
          scenarioForPersona.steps = [
            ...screens.map((screen, index) => ({
              title: screen.title,
              description: screen.description,
              asset: screen.asset || undefined,
              type: screen.type || 'HUMAN_TASK',
              order: index,
              actions: screen.actions || [sampleAction],
              screenId: "INFO",
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
              actions: [sampleAction],
            })
          }
    
          return scenarioForPersona
        })
        console.log('personaScenarios',personaScenarios);
  }
  if (!currentStep) return null

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
              setIsOpen(false)
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

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={() => setStepState('no-selection')}>{t('action.cancel_label')}</ButtonOutline>
            {/* <Link href="/publish"> */}
            <ButtonOutline  onClick={form.handleSubmit(onSubmit)}>
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
          console.log('Item Deleted')
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
