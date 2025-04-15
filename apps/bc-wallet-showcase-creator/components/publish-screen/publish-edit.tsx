'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { baseUrl, convertBase64 } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { toast } from 'sonner'
import Image from 'next/image'
import { ShowcaseRequest, ShowcaseStatus, AssetResponse } from 'bc-wallet-openapi'
import { z } from 'zod'

import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useCreateAsset } from '@/hooks/use-asset' 

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
  const { mutateAsync: createAsset } = useCreateAsset()
  
  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      try {
        const base64 = await convertBase64(newValue)
        if (typeof base64 === 'string') {
          await createAsset(
            {
              content: base64,
              mediaType: newValue.type,
            },
            {
              onSuccess: (data: unknown) => {
                const response = data as AssetResponse
                onChange(response.asset.id)
              },
              onError: (error) => {
                console.error('Error creating asset:', error)
              },
            },
          )
        }
      } catch (error) {
        console.error('Error converting file:', error)
      }
    } else {
      onChange('')
    }
  }

  // Simply render the component with minimal logic
  return (
    <div className="flex items-center flex-col justify-center">
      <p className="text-md w-full text-start font-bold text-foreground mb-3">{text}</p>

      <div className="w-full">
        {value && (
          <div className="relative mb-4 flex justify-center">
            <div className="relative w-60 h-60">
              <button
                className="bg-red-500 rounded p-1 absolute z-10 text-white right-0 top-0 text-sm hover:bg-red-400"
                onClick={(e) => {
                  e.preventDefault()
                  onChange('')
                }}
              >
                <Trash2 size={16} />
              </button>
              <Image
                alt="banner preview"
                src={`${baseUrl}/assets/${value}/file`}
                width={240}
                height={240}
                className="rounded-lg shadow object-cover"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
        
        {!value && (
          <label
            htmlFor="bannerImage"
            className="p-3 flex flex-col items-center justify-center w-full h-60 bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
          >
            <div className="flex flex-col items-center h-full justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
              <p className="text-center text-xs lowercase">
                <span className="font-bold">{t('file_upload.click_to_upload_label')}</span>{' '}
                {t('file_upload.drag_to_upload_label')}
              </p>
            </div>
          </label>
        )}
        
        <input
          id="bannerImage"
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </div>
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
  const { tenantId } = useHelpersStore()

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(ShowcaseRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'PENDING',
      hidden: false,
      scenarios: [],
      personas: [],
      tenantId,
    },
  })

  useEffect(() => {
    form.reset({
      ...showcase,
      name: showcase.name || '',
      description: showcase.description || '',
      personas: personas.map((persona) => persona.id) || [],
      status: 'PENDING',
      tenantId,
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
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
