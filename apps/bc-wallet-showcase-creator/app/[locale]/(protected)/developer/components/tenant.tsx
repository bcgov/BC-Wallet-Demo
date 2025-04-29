'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTenants } from '@/hooks/use-tenants'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { decodeJwt } from '@/auth'

export const Tenant = () => {
  const { isLoading, error } = useTenants()
  const { setTenantId, tenantId } = useHelpersStore()
  const { data: session } = useSession()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  const handleCreateTenant = async () => {
    const token = decodeJwt(session?.accessToken)
    setTenantId(token.azp)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant</CardTitle>
        <CardDescription> {tenantId} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 dark:bg-foreground/10 rounded text-xs">
          <pre className="mb-2 pre-wrap">Tenants: {tenantId}</pre>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateTenant}>
            Create Tenant
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
