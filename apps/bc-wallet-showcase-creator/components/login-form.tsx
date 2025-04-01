'use client'

import { GalleryVerticalEnd } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@/i18n/routing'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

type LoginForm = {
  email: string
  password: string
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('login')

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleSubmit = (data: LoginForm) => {
    console.log(data)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a href="/" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">{t('app_name')}</span>
              </a>
              <h1 className="text-xl font-bold">{t('welcome_message')}</h1>
              <div className="text-center text-sm">
                {t('dont_have_account_label')}
                <Link href="/" className="underline underline-offset-4">
                  {t('sign_up_label')}
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email_label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                {t('login_label')}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        {t('terms_of_service_label')} <Link href="/">{t('terms_of_service_label')}</Link> and{' '}
        <Link href="/">{t('privacy_policy_label')}</Link>.
      </div>
    </div>
  )
}
