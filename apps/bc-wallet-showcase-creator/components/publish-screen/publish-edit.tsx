'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { convertBase64 } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { toast } from 'sonner'
import Image from 'next/image'
import { ShowcaseRequest, ShowcaseStatus } from 'bc-wallet-openapi'
import { z } from 'zod'

import { ConfirmationDialog } from '@/components/confirmation-dialog'

const BannerImageUpload = ({
  text,
  value,
  onChange,
}: {
  text: string
  value?: string
  onChange: (value: string) => void
}) => {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      try {
        const base64 = await convertBase64(newValue)
        if (typeof base64 === 'string') {
          const mimeType = newValue.type
          const base64WithoutPrefix = base64.replace(/^data:image\/[a-zA-Z+\-]+;base64,/, '')

          setPreview(`${mimeType};base64,${base64WithoutPrefix}`)
          onChange(base64WithoutPrefix)
        }
      } catch (error) {
        console.error('Error converting file:', error)
      }
    } else {
      setPreview(null)
      onChange('')
    }
  }
  return (
    <div className="flex items-center flex-col justify-center">
      <p className="text-md w-full text-start font-bold text-foreground mb-3">{text}</p>

      {preview && (
        <div className="relative w-full">
          <button
            className="bg-red-500 rounded p-1 m-2 absolute text-black right-0 top-0 text-sm hover:bg-red-400"
            onClick={(e) => {
              e.preventDefault()
              void handleChange(null)
            }}
          >
            <Trash2 />
          </button>
        </div>
      )}
      <label
        htmlFor="bannerImage"
        className="p-3 flex flex-col items-center justify-center w-full h-full bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
      >
        <div className="flex flex-col items-center h-[240px] justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
          {preview ? (
            <Image
              alt={'preview'}
              className="p-3 w-3/4"
              src={`data:image/${preview}`}
              width={300}
              height={100}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <p className="text-center text-xs lowercase">
              <span className="font-bold">{t('file_upload.click_to_upload_label')}</span>{' '}
              {t('file_upload.drag_to_upload_label')}
            </p>
          )}
        </div>
        <input
          id="bannerImage"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

const ShowcaseRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.nativeEnum(ShowcaseStatus),
  hidden: z.boolean(),
  tenantId: z.string().min(1),
})

export const PublishEdit = () => {
  const t = useTranslations()
  const { showcase, reset, setScenarioIds } = useShowcaseStore()
  const router = useRouter()
  const { saveShowcase } = useOnboardingAdapter()
  const { personas } = useOnboardingAdapter()

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(ShowcaseRequestSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      description: '',
      status: 'PENDING',
      hidden: false,
      tenantId: 'test-tenant-1',
      scenarios: [],
      personas: [],
    },
  })

  useEffect(() => {
    form.reset({
      ...showcase,
      name: showcase.name || '',
      description: showcase.description || '',
      personas: personas.map((persona) => persona.id) || [],
      status: 'PENDING',
      tenantId: 'test-tenant-1',
    })
  }, [form, showcase])

  const onSubmit = async () => {
    const data = form.getValues()
    await saveShowcase(data)
    toast.success('Showcase created successfully')
    reset()
    setScenarioIds([])
    router.push('/showcases')
  }

  const handleCancel = () => {
    form.reset()
    reset()
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Publish your showcase'} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow space-y-6">
          <div className="space-y-6 flex-grow">
            <FormTextInput
              control={form.control}
              label="Showcase Name"
              name="name"
              register={form.register}
              error={form.formState.errors.name?.message}
              placeholder="Enter showcase name"
            />
            <FormTextArea
              control={form.control}
              label="Showcase Description"
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              placeholder="Enter showcase description"
            />
            <FormTextArea
              control={form.control}
              label="Showcase Completion Details"
              name="completionMessage"
              register={form.register}
              error={form.formState.errors.completionMessage?.message}
              placeholder="Add details here that should appear in the pop-up box that appears at completion of your showcase."
            />
            <div className="space-y-2">
              <BannerImageUpload
                text={t('onboarding.icon_label')}
                value={form.watch('bannerImage')}
                onChange={(value) =>
                  form.setValue('bannerImage', value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex justify-between">
            <div>
              <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>
            </div>
            <div className="flex gap-3">
              <ConfirmationDialog
                title="Submit for Review?"
                content={<>
                  {t('showcase.modal_description')}
                  <br />
                  {t('showcase.modal_description2')}
                </>
                }
                buttonLabel={t('showcase.button_label')}
                onSubmit={onSubmit}
                disabled={!form.formState.isValid || !form.formState.isDirty}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
