import React from 'react'

import LandingPage from '@/components/home-screen/landing-page'

async function HomePage() {
  return (
    <div className={`flex bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text`}>
      <main className={`flex-1 bg-light-bg dark:bg-dark-bg dark:text-dark-text text-light-text `}>
        <LandingPage />
      </main>
    </div>
  )
}

export default HomePage
