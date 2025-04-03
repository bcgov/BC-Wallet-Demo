import { useEffect, useState } from 'react'

import { convertBase64 } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

export const FileUploadFull = ({
  text,
  element,
  initialValue,
  handleJSONUpdate,
}: {
  text: string
  element: string
  initialValue?: string
  handleJSONUpdate: (imageType: string, imageData: string) => void
}) => {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(initialValue || null)

  useEffect(() => {
    setPreview(initialValue || null)
  }, [initialValue])

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      try {
        const base64 = await convertBase64(newValue)
        if (typeof base64 === 'string') {
          const mimeType = newValue.type
          const base64WithoutPrefix = base64.replace(/^data:image\/[a-zA-Z+\-]+;base64,/, '')

          setPreview(`${mimeType};base64,${base64WithoutPrefix}`)
          handleJSONUpdate(element, base64WithoutPrefix)
        }
      } catch (error) {
        console.error('Error converting file:', error)
      }
    } else {
      setPreview(null)
      handleJSONUpdate(element, '')
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
        htmlFor={element}
        className="p-3 flex flex-col items-center justify-center w-full h-full bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
      >
        <div className="flex flex-col items-center h-[240px] justify-center border rounded-lg border-dashed dark:border-dark-border p-2 w-full">
          {preview ? (
            <Image
              alt={text}
              className="p-3 max-w-full max-h-full object-contain"
              src={`data:image/${preview}`}
              width={300}
              height={100}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-center text-xs lowercase">
              <span className="font-bold">{t('file_upload.click_to_upload_label')}</span>{' '}
              {t('file_upload.drag_to_upload_label')}
            </p>
          )}
        </div>
        <input
          id={element}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
