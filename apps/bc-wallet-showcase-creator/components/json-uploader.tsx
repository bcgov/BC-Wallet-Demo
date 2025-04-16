'use client'

import { useState, useRef } from 'react'

import { useShowcaseStore } from '@/hooks/use-showcase-store'
import { useTranslations } from 'next-intl'

import { ErrorModal } from './error-modal'

export const JSONUploadButton = () => {
  const t = useTranslations()
  const [showModal, setShowModal] = useState(false)
  const { setShowcaseJSON } = useShowcaseStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = () => {
        const fileContent = reader.result
        try {
          if (typeof fileContent === 'string') {
            setShowcaseJSON(JSON.parse(`{"personas": ${fileContent}}`))
          }
        } catch (e) {
          console.error(e)
          console.log('JSON is not formatted properly!')
          setShowModal(true)
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      console.log('Invalid file format. Please select a JSON file.')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <div className="border rounded hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover">
        <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
        <button
          className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          onClick={handleClick}
        >
          {t('action.load_label')}
        </button>
      </div>

      {showModal ? (
        <ErrorModal
          errorText={
            'Uploaded file was invalid. \n Please try again, or open the file in a text editor to check for well-formed JSON.'
          }
          setShowModal={setShowModal}
        />
      ) : null}
    </>
  )
}
