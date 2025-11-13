import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="mx-auto max-w-md space-y-6 px-4 text-center">
        <div className="flex justify-center">
          <ShieldAlert className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-light-text dark:text-dark-text">
            Access Denied
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            You don't have permission to access this page
          </p>
        </div>

        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
          <p className="font-medium mb-1">Admin Role Required</p>
          <p>
            The Showcase Creator requires an admin role to access. Please contact your administrator 
            to request the necessary permissions.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
