'use client'

import { useState, useEffect } from 'react'
import { useCreateAsset } from '@/hooks/use-asset'
import { baseUrl, convertBase64 } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AssetResponse } from 'bc-wallet-openapi'
import Image from 'next/image'
import { useTenant } from '@/providers/tenant-provider'

export const BannerImageUpload = ({
  text,
  value,
  onChange,
  maxSize,
  onImageUploadError,
  isMandatory
}: {
  text: string
  value?: string
  onChange: (value: string) => void
  maxSize?: number // Max size in bytes
  onImageUploadError?: (error: string) => void
  isMandatory?: boolean
}) => {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(null)
  const { mutateAsync: createAsset } = useCreateAsset()
  const { tenantId } = useTenant()

  useEffect(() => {
    if (value) {
      setPreview(`${baseUrl}/${tenantId}/assets/${value}/file`)
    } else {
      setPreview(null)
    }
  }, [value])

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      if (maxSize && newValue.size > maxSize) {
        onImageUploadError?.(t('file_upload.file_size_exceeded'));
        return;
      }
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
                setPreview(`data:${newValue.type};base64,${base64}`)
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
      <p className="text-md w-full text-start font-bold text-foreground/80 mb-3">{text}{isMandatory ? <span className="text-red-500">*</span> : null}</p>

      <label
        htmlFor="bannerImage"
        className="p-3 flex flex-col items-center justify-center w-full h-full bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
      >
        <div className="relative flex flex-col items-center h-[240px] w-full justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
          {preview ? (
            <>
              <button
                className="bg-red-500 rounded p-1 m-2 absolute text-black right-0 top-0 text-sm hover:bg-red-400 z-10"
                onClick={(e) => {
                  e.preventDefault()
                  void handleChange(null)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Image
                alt="preview"
                className="p-3 object-contain"
                src={preview}
                fill
                priority={true}
              />
            </>
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
          accept="image/png, image/jpeg, image/svg+xml"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
