'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { hasRole } from '@/auth'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('AdminGuard - status:', status)
    console.log('AdminGuard - session:', JSON.stringify(session?.user))
    console.log('AdminGuard - roles:', JSON.stringify(session?.user?.roles))

    if (status === 'loading') {
      return // Still loading, do nothing
    }

    if (status === 'unauthenticated') {
      // Not logged in, redirect to login
      console.log('AdminGuard - redirecting to login (unauthenticated)')
      router.push('/login')
      return
    }

    // Check admin role
    const isAdmin = session?.user?.roles 
      ? hasRole(session.user.roles, 'admin')
      : false

    console.log('AdminGuard - isAdmin:', isAdmin)

    if (!isAdmin) {
      console.log('AdminGuard - redirecting to unauthorized (not admin)')
      router.push('/unauthorized')
    }
  }, [session, status, router])

  // Show loading state while checking
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has admin role
  const isAdmin = session?.user?.roles 
    ? hasRole(session.user.roles, 'admin')
    : false

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
