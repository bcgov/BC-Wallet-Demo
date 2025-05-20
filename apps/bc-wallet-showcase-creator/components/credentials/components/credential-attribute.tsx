import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

import { FormTextInput } from '@/components/text-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CredentialAttribute, CredentialAttributeType } from 'bc-wallet-openapi'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type FormData = {
  attributes: {
    name: string
    value: string
    type: CredentialAttributeType
  }[]
}

interface SchemaAttributesProps {
  mode: 'create' | 'view'
  form: UseFormReturn<FormData>
  attributes?: CredentialAttribute[]
}
export const CredentialAttributes = ({ mode, form, attributes }: SchemaAttributesProps) => {
  const t = useTranslations()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attributes',
  })
  const typeWatch = form.watch('attributes')
  const allowedTypes: CredentialAttributeType[] = ["STRING", "DATE"];

  if (mode === 'view' && attributes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-x-2 mx-4 py-3 border-b border-gray-200">
          <h3 className="text-md font-semibold text-foreground">{t('credentials.attributes_label')}</h3>
        </div>
        <Table className="w-full gap-x-2 px-4 py-3">
          <TableHeader className="bg-gray-100 dark:bg-dark-bg-tertiary border-b border-gray-200 uppercase dark:border-dark-border">
            <TableRow>
              <TableHead>{t('credentials.attribute_name_label')}</TableHead>
              <TableHead className="w-1/2">{t('credentials.attribute_type_label')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background border-b border-gray-200 dark:border-dark-border">
            {attributes.map((attr, index) => (
              <TableRow className='border-b border-foreground/10' key={attr.name || index}>
                <TableCell className="font-semibold w-1/2 text-sm text-foreground py-2">{attr.name}</TableCell>
                <TableCell className="w-1/2 text-sm text-foreground py-2 pr-2">{attr.type || 'string'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* <div className="overflow-x-auto w-full">
          {attributes.map((attr, index) => (
            <div key={attr.name || index} className="flex">
              <p className="w-1/2 text-sm text-foreground py-2 ">{attr.type || 'string'}</p>
              <p className="w-1/2 text-sm text-foreground py-2 ">{attr.name}</p>
            </div>
          ))}
        </div> */}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 py-3 border-b border-foreground/10">
        <label className="text-md font-bold">{t('credentials.add_attributes_label')}</label>
        <Button
          type="button"
          variant="outlineAction"
          size="sm"
          onClick={() =>
            append({
              name: '',
              value: '',
              type: CredentialAttributeType.String,
            })
          }
        >
          {t('credentials.attributes_add_attribute_label')}
          <Plus className="w-4 h-4 text-foreground rounded-full border border-foreground/80" />
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const fieldType = typeWatch?.[index]?.type || 'STRING'

          return (
            <div key={field.id} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-bold mb-2 block text-foreground/80">
                  {t('credentials.attribute_type_label')}
                </label>
                <Select
                  onValueChange={(value) => {
                    form.setValue(`attributes.${index}.type`, value as CredentialAttributeType)
                  }}
                  defaultValue={field.type || 'STRING'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(allowedTypes).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <FormTextInput
                  control={form.control}
                  name={`attributes.${index}.name`}
                  label={t('credentials.attribute_name_label')}
                  className="text-sm"
                  register={form.register}
                  error={form.formState.errors?.attributes?.[index]?.name?.message}
                  placeholder={t('credentials.attribute_name_placeholder')}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
