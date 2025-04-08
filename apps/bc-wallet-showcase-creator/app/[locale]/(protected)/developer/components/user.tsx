'use client'
import { signOut, useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const User = () => {
  const { data: session, status, update } = useSession()

  return (
    <Card>
      <CardHeader>
        <CardTitle>User</CardTitle>
        <CardDescription> {session?.user?.email} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 dark:bg-foreground/10 rounded text-xs">
          <pre className="mb-2 pre-wrap">Session: {JSON.stringify(session)}</pre>
          <div className="mb-2">Status: {JSON.stringify(status)}</div>
        </div>
      
      </CardContent>
      <CardFooter>  
        <div className="flex gap-2">
        <Button variant="outline" onClick={() => update({ name: 'John Doe' })}>Update</Button>

<Button variant="destructive" onClick={() => signOut()}>Sign Out</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
