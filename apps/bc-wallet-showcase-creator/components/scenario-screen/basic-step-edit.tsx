'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormTextInput, FormTextArea } from '@/components/text-input'
import { Form } from '@/components/ui/form'
import { RequestType, StepType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import DeleteModal from '../delete-modal'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { StepRequest, StepRequestType } from '@/openapi-types'

export const BasicStepEdit = () => {
  const t = useTranslations()
  const { selectedScenario, setStepState, selectedStep } = usePresentationCreation()

  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentStep = selectedScenario && selectedStep !== null ? selectedScenario.steps[selectedStep.stepIndex] : null

  const form = useForm<StepRequestType>({
    resolver: zodResolver(StepRequest),
    mode: 'all',
    defaultValues: {
      type: StepType.HUMAN_TASK,
      title: '',
      description: '',
    },
  })

  useEffect(() => {
    if (currentStep) {
      form.reset(currentStep)
    }
  }, [currentStep, form.reset])

  const onSubmit = (data: StepRequestType) => {
    console.log('data', data)
    if (selectedScenario === null || selectedStep === null) return

    // Transform the form data back to the expected format
    const stepData = {
      ...data,
      type: data.type.toUpperCase() as StepType,
      actions: {
        ...data.actions,
        type: data.actions[0].actionType.toUpperCase() as RequestType,
      },
    }
    console.log('StepData After Update', stepData)
    // updateStep(selectedScenario, selectedStep, stepData)
    setStepState('no-selection')
  }
  console.log('form.formState', form.formState)
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
            <ButtonOutline disabled={!form.formState.isDirty || !form.formState.isValid}>
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
