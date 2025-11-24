import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AdminGuard } from '@/components/admin/admin-guard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminGuard>
        <div className="min-h-screen bg-background">
          <div className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Admin Panel</h2>
                  <p className="text-sm text-muted-foreground">
                    Tenant and system administration
                  </p>
                </div>
              </div>
            </div>
          </div>
          <main>{children}</main>
        </div>
      </AdminGuard>
    </SessionProvider>
  )
}
