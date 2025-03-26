import type { UseFormRegister, FieldValues, Path, RegisterOptions, Control } from 'react-hook-form'

import { cn } from '@/lib/utils'

import { FormField, FormItem, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface FormInputProps<T extends FieldValues> {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  error?: string
  placeholder?: string
  className?: string
  rules?: RegisterOptions
  readOnly?: boolean
  disabled?: boolean
  control: Control<T>
}

export const FormTextInput = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
  className,
  control,
}: FormInputProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className={cn('space-y-2', className)}>
            <Label className="text-md font-bold text-foreground/80" htmlFor={name}>
              {label}
            </Label>
            <Input
              className="mt-3 border dark:border-dark-border text-foreground"
              id={name}
              type="text"
              placeholder={placeholder}
              {...register(name)}
              {...field}
            />
            {error && <FormMessage className="text-red-500 text-sm">{error}</FormMessage>}
          </div>
        </FormItem>
      )}
    />
  )
}

export const FormTextArea = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
  className,
  readOnly,
  disabled,
}: FormInputProps<T>) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-md font-bold text-foreground/80" htmlFor={name}>
        {label}
      </Label>
      <Textarea
        className="rounded w-full dark:text-dark-text dark:bg-dark-input bg-light-bg resize-none mt-3 p-2 border dark:border-dark-border"
        rows={3}
        id={name}
        placeholder={placeholder}
        {...register(name)}
        readOnly={readOnly}
        disabled={disabled}
        style={{ pointerEvents: disabled ? 'none' : 'auto' }} // Block pointer events when disabled
      />
      {error && <FormMessage className="text-red-500 text-sm">{error}</FormMessage>}
    </div>
  )
}

