'use client'

import { useForm } from 'react-hook-form'

import { Form } from '@/components/ui/form'
import type { CredentialImportFormData } from '@/schemas/credentialImport'
import { credentialSchema } from '@/schemas/credentialImport' // Adjusted to import the correct schema
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { FormTextInput } from '../text-input'
import ButtonOutline from '../ui/button-outline'
import Accordion from './components/accordion-group'

export const CredentialsImport = () => {
  const t = useTranslations()

  const defaultValues: CredentialImportFormData = {
    credentialId: '',
    schemaId: '',
    icon: '',
    proofRequestCheckbox: false,
    issuanceCheckbox: false,
  }

  const form = useForm<CredentialImportFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues,
    mode: 'onChange',
  })

  // Fetch schema and credential data when schemaId or credentialId changes

  const onSubmit = (data: CredentialImportFormData) => {
    form.reset()
    // Optionally handle submission (e.g., send data to the backend)
  }

  const handleCancel = () => {
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="my-4 flex flex-col">
        <div className="flex flex-col gap-x-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold ">{t('credentials.import_header_title')}</h3>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FormTextInput
              control={form.control}
              label={t('credentials.credential_id_label')}
              name="credentialId"
              register={form.register}
              error={form.formState.errors.credentialId?.message}
              placeholder={t('credentials.credential_id_placeholder')}
            />

            <FormTextInput
              control={form.control}
              label={t('credentials.schema_id_label')}
              name="schemaId"
              register={form.register}
              error={form.formState.errors.schemaId?.message}
              placeholder={t('credentials.schema_id_placeholder')}
            />
          </div>
          <div className=" mx-auto ">
            <div className="grid md:grid-cols-1 gap-2">
              <h3 className="text-lg font-bold text-foreground">{t('credentials.import_instructions_title')}</h3>
              {/* Column 1 */}
              <Accordion />
            </div>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 dark:border-gray-700 dark:bg-dark-bg p-4 flex justify-end gap-4">
            <ButtonOutline type="button" onClick={handleCancel}>
              {t('action.cancel_label')}
            </ButtonOutline>
            <ButtonOutline type="submit" disabled={!form.formState.isValid}>
              {t('action.create_label')}
            </ButtonOutline>
          </div>{' '}
        </div>
      </form>
    </Form>
  )
}
