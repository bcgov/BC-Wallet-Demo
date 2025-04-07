import type { PropsWithChildren } from 'react'
import React from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { Footer } from '@/components/footer'
import { SidebarInset } from '@/components/ui/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { PageParams } from '@/types'
import { SessionProvider } from 'next-auth/react'
import { CommandDialogMenu } from '@/components/command/command-dialog-menu'
type Params = PropsWithChildren<{
  params: PageParams
}>

export default async function RootLayout({ children }: Params) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-auto">{children}</main>
          <Footer />
          <CommandDialogMenu />
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
