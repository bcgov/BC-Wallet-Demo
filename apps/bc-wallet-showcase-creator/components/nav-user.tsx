'use client'

import { LogOutIcon, MoreVerticalIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { signOut, useSession } from 'next-auth/react'
import { DarkModeToggle } from './dark-mode-toggle'
import { LanguageSelector } from './language-selector'
import { Separator } from './ui/separator'
import { usePathname, useRouter } from 'next/navigation'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session } = useSession()
  const { state } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [locale, tenant] = pathname.split('/').filter(Boolean)

  const handleLogout = async () => {
    document.cookie = 'tenant-id=; path=/; max-age=0; SameSite=Lax'

    // get issuer from backend
    const response = await fetch(`/api/auth/issuer?locale=${locale}&tenant=${tenant}`, {
      credentials: 'include',
    })

    // clear NextAuth session in-memory
    await signOut({ redirect: false })

    if (response.ok) {
      const { issuer } = await response.json()
      const redirectUri = encodeURIComponent(`${window.location.origin}/${locale}/${tenant}/login`)
      window.location.href = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUri}`
    }
  }


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-row gap-2">
          {state !== 'collapsed' && <LanguageSelector />}
          <DarkModeToggle />
        </div>
        <Separator className="my-2" />
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarFallback className="rounded-lg">{session?.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session?.user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{session?.user?.email}</span>
                </div>
                <MoreVerticalIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{session?.user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{session?.user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{session?.user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
