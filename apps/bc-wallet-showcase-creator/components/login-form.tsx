'use client'

import { GalleryVerticalEnd } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('login')
  const pathname = usePathname()
  const parts = pathname.split('/')
  const locale = parts[1] || 'en'
  const tenantId = parts[2]

  useEffect(() => {
    if (tenantId) {
      document.cookie = `tenant-id=${tenantId}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, [tenantId]);
  
  const handleLogin = () => {


    signIn('keycloak', {
      callbackUrl: `/${locale}/${tenantId}`
    })
  }


  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">{t('app_name')}</span>
            </a>
            <h1 className="text-xl font-bold">{t('welcome_message')}</h1>
          </div>
          <div className="flex flex-col gap-6">
            <Button className="w-full" onClick={() => handleLogin()}>
            {/* <Button className="w-full" onClick={() => signIn()}> */}
              {t('login_label')}
            </Button>
          </div>
        </div>
      </div>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        {t('terms_of_service_label')} <Link href="/">{t('terms_of_service_label')}</Link> and{' '}
        <Link href="/">{t('privacy_policy_label')}</Link>.
      </div>
    </div>
  )
}
