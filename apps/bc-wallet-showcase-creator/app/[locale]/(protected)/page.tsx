import React from 'react'

import LandingPage from '@/components/home-screen/landing-page'

async function HomePage() {
  return (
    <div className="flex-1 bg-light-bg dark:bg-dark-bg dark:text-dark-text text-light-text min-h-[calc(100vh-40px)]">
      <LandingPage />
    </div>
  )
}

export default HomePage
