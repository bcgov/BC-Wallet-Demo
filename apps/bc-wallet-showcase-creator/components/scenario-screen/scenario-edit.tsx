'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormTextInput, FormTextArea } from '@/components/text-input'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useScenarios } from '@/hooks/use-scenarios'
import { scenarioToFormData } from '@/lib/scenario-transformers'
import { scenarioSchema } from '@/schemas/scenario'
import type { ScenarioFormData } from '@/schemas/scenario'
import type { Scenario } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import DeleteModal from '../delete-modal'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'

export const ScenarioEdit = () => {
  const t = useTranslations()
  const { scenarios, selectedScenario, updateScenario, setStepState, removeScenario } = useScenarios()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentScenario = selectedScenario !== null ? scenarios[selectedScenario] : null

  const form = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (currentScenario) {
      const formData = scenarioToFormData(currentScenario)
      form.reset(formData)
    }
  }, [currentScenario, form.reset])
  const onSubmit = (data: ScenarioFormData) => {
    if (selectedScenario === null) return
    const updatedScenario: Scenario = {
      ...data,
      overview: {
        ...data.overview,
        image: data.overview.image ?? '',
      },
      summary: {
        ...data.summary,
        image: data.summary.image ?? '',
      },
      steps: currentScenario?.steps || [],
    }

    updateScenario(selectedScenario, updatedScenario)
    setStepState('none-selected')
  }

  if (!currentScenario) return null

  return (
    <>
      <StepHeader
        icon={<Monitor strokeWidth={3} />}
        title={t('scenario.edit_header_title')}
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
          {/* <div>
          <p className="text-foreground text-sm">{t('scenario.edit_header_title')}</p>
          <h3 className="text-2xl font-bold text-foreground">{t('scenario.edit_header_title')}</h3>
        </div>
        <hr /> */}

          <div className="space-y-6">
            <h4 className="text-xl font-bold">{t('scenario.edit_overview_label')}</h4>

            <FormTextInput
              label={t('scenario.edit_name_label')}
              name="name"
              register={form.register}
              error={form.formState.errors.name?.message}
              placeholder={t('scenario.edit_name_placeholder')}
              control={form.control}
            />

            <FormTextInput
              label={t('scenario.scenario_description')}
              name="overview.title"
              register={form.register}
              error={form.formState.errors.overview?.title?.message}
              placeholder={t('scenario.edit_page_title_placeholder')}
              control={form.control}
            />
            {/* 
          <FormTextArea
            label={t('scenario.edit_page_description_label')}
            name="overview.text"
            register={form.register}
            error={form.formState.errors.overview?.text?.message}
            placeholder={t('scenario.edit_page_description_placeholder')}
          /> */}

            {/* <div className="space-y-2">
          <LocalFileUpload
              text={t('scenario.edit_image_label')}
              element={["overview", "image"]}
              handleLocalUpdate={(path, value) => 
                form.setValue(
                  `${path[0]}.${path[1]}` as "overview.image" | "summary.image", 
                  value, 
                  {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  }
                )
              }
              localJSON={{ 
                overview: { image: form.watch("overview.image") },
                summary: { image: form.watch("summary.image") }
              }}
            />
            {form.formState.errors.overview?.image && (
              <p className="text-sm text-destructive">
                {form.formState.errors.overview.image.message}
              </p>
            )}
          </div> */}
          </div>

          <hr />

          {/* Summary Section */}
          {/* <div className="space-y-6">
          <h4 className="text-xl font-bold">{t('scenario.edit_summary_label')}</h4>

          <FormTextInput
            label={t('scenario.edit_page_title_label')}
            name="summary.title"
            register={form.register}
            error={form.formState.errors.summary?.title?.message}
            placeholder={t('scenario.edit_page_title_placeholder')}
          />

          <FormTextArea
            label={t('scenario.edit_page_description_label')}
            name="summary.text"
            register={form.register}
            error={form.formState.errors.summary?.text?.message}
            placeholder={t('scenario.edit_page_description_placeholder')}
          />

          <div className="space-y-2">
          <LocalFileUpload
              text={t('scenario.edit_image_label')}
              element={["summary", "image"] as [string, string]}
              handleLocalUpdate={(path, value) => 
                form.setValue(
                  `${path[0]}.${path[1]}` as "overview.image" | "summary.image", 
                  value, 
                  {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  }
                )
              }
              localJSON={{ 
                overview: { image: form.watch("overview.image") },
                summary: { image: form.watch("summary.image") }
              }}
            />
            {form.formState.errors.summary?.image && (
              <p className="text-sm text-destructive">
                {form.formState.errors.summary.image.message}
              </p>
            )}
          </div>
        </div> */}

          <div className="flex justify-end gap-4 pt-6">
            {/* <Button
            type="button"
            variant="outline"
            onClick={() => setStepState("none-selected")}
          >
            {t('action.cancel_label')}
          </Button> */}
            <ButtonOutline type="button" onClick={() => setStepState('none-selected')}>
              {t('action.cancel_label')}
            </ButtonOutline>
            <ButtonOutline
              type="submit"
              // disabled={!form.formState.isDirty || !form.formState.isValid}
            >
              {t('action.save_label')}
            </ButtonOutline>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid}>
              {t('action.save_label')}
            </Button>
          </div>
        </form>
      </Form>
      <DeleteModal
        isLoading={false}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={() => {
          console.log('Item Deleted')
          setIsModalOpen(false)
          removeScenario(0)
        }}
        header="Are you sure you want to delete this scenario?"
        description="Are you sure you want to delete this scenario?"
        subDescription="<b>This action cannot be undone.</b>"
        cancelText="CANCEL"
        deleteText="DELETE"
      />
    </>
  )
}
