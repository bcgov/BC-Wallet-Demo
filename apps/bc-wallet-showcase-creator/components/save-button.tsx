'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

import { SaveModal } from './save-modal'

export const SaveButton = () => {
  const [showModal, setShowModal] = useState(false)
  const t = useTranslations()

  return (
    <>
      <Button
        variant="outline"
        className="mx-4 inline-flex items-center border  gap-x-1.5 dark:hover:bg-dark-btn-hover rounded-md  px-5 py-1.5 text-sm font-semibold shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
        onClick={() => setShowModal(true)}
      >
        {t('action.save_process_label')}
      </Button>

      {showModal ? <SaveModal setShowModal={setShowModal} /> : null}
    </>
  )
}
