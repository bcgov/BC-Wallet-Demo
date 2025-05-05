'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useShowcaseStore } from '@/hooks/use-showcases-store'

export const ShowcaseDev = () => {
  const { displayShowcase, reset } = useShowcaseStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Showcase</CardTitle>
        <CardDescription> {displayShowcase.name} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 dark:bg-foreground/10 rounded text-xs">
          <pre className="mb-2 pre-wrap">Showcase: {JSON.stringify(displayShowcase)}</pre>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => reset()}>
            Reset
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
