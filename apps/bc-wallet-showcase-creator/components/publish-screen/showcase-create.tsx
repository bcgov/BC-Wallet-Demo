'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useCreateAsset } from '@/hooks/use-asset'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { convertBase64 } from '@/lib/utils'
import type { AssetResponseType, ShowcaseRequestType } from '@/openapi-types'
import { ShowcaseRequest } from '@/openapi-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, X } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { ShowcaseResponse } from 'bc-wallet-openapi'

import { toast } from 'sonner'
import Image from 'next/image'
import { useUiStore } from '@/hooks/use-ui-store'
import { useCreateShowcase } from '@/hooks/use-showcases'

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
                const response = data as AssetResponseType
                setPreview(base64)
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
              alt="preview"
              className="p-3 w-3/4"
              src={preview}
              width={300}
              height={100}
              style={{ width: '90%', height: '90%' }}
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

// {
//   "name": "example_name",
//   "description": "example_description",
//   "status": "ACTIVE",
//   "hidden": false,
//   "scenarios": [],
//   "credentialDefinitions": [],
//   "personas": []
// }

export const ShowcaseCreate = () => {
  const t = useTranslations()
  const { setCurrentShowcaseSlug } = useUiStore()
  const router = useRouter()
  const { mutateAsync: createShowcase } = useCreateShowcase()

  const form = useForm<ShowcaseRequestType>({
    resolver: zodResolver(ShowcaseRequest),
    mode: 'all',
    defaultValues: {
      name: '',
      description: '',
      status: 'PENDING',
      hidden: false,
      scenarios: [],
      credentialDefinitions: [],
      personas: [],
    },
  })

  const onSubmit = async (data: ShowcaseRequestType) => {
    console.log('data', data)
    createShowcase(data, {
      onSuccess: (data: unknown) => {
        const response = data as ShowcaseResponse
        console.log('Showcase created successfully', response)
        if (response.showcase?.slug) {
          setCurrentShowcaseSlug(response.showcase.slug)
          toast.success('Showcase created successfully')
          router.push(`/showcases/${response.showcase.slug}/characters`)
          // router.push(`/showcases/create/characters`)
        } else {
          toast.error('Error creating showcase')
        }
      },
      onError: () => {
        toast.error('Error creating showcase')
      },
    })
  }

  const handleCancel = () => {
    form.reset()
  }

  return (
    <div className="flex flex-col p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Create your showcase'} showDropdown={false} />

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

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>

            <div className="flex gap-3">
              <ButtonOutline disabled={!form.formState.isValid || !form.formState.isDirty} type="submit">
                {t('action.next_label')}
              </ButtonOutline>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
