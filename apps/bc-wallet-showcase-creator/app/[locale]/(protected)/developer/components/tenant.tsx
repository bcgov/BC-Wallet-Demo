'use client'

import { signOut } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCreateTenant, useTenants } from '@/hooks/use-tenants'

export const Tenant = () => {
  const { data, isLoading, error } = useTenants()
  const { mutateAsync: createTenant } = useCreateTenant()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  const handleCreateTenant = async () => {
    const generatedId = Math.random().toString(36).substring(2, 15)
    await createTenant({ id: `tenant-${generatedId}` })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant</CardTitle>
        <CardDescription> {data?.tenants?.[0]?.id} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 dark:bg-foreground/10 rounded text-xs">
          <pre className="mb-2 pre-wrap">Tenants: {JSON.stringify(data?.tenants)}</pre>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateTenant}>
            Create Tenant
          </Button>

          <Button variant="destructive" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
