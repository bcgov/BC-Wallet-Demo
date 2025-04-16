import type { PropsWithChildren } from 'react'
import React from 'react'
import Script from 'next/script'

import { Toaster } from '@/components/ui/sonner'
import i18nConfig from '@/i18n.config'
import { routing } from '@/i18n/routing'
import { QueryProviders } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import { Montserrat, Inter } from "next/font/google";
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Locale, PageParams } from '@/types'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }))
}

type Params = PropsWithChildren<{
  params: PageParams
}>

export default async function RootLayout({ children, params }: Params) {
  const { locale } = await params
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale)) {
    notFound()
  }

  // Providing all messages to the client
  const messages = await getMessages()

  // Get environment variables from server
  const envVars = {
    WALLET_URL: process.env.NEXT_PUBLIC_WALLET_URL,
    SHOWCASE_BACKEND: process.env.NEXT_PUBLIC_SHOWCASE_BACKEND,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="env-script" strategy="beforeInteractive">
          {`window.__env = ${JSON.stringify(envVars)};`}
        </Script>
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProviders>
            <NextIntlClientProvider messages={messages}>
              {children}
              <Toaster />
            </NextIntlClientProvider>
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
