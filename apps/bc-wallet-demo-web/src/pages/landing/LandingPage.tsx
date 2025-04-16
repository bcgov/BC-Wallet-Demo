import React from 'react'

import { motion } from 'framer-motion'

import { page } from '../../FramerAnimations'
import { useTitle } from '../../hooks/useTitle'
import { Footer } from './components/Footer'
import { MainSection } from './components/MainSection'
import { NavBar } from './components/Navbar'

export const LandingPage: React.FC = () => {
  useTitle('BC Wallet Showcase')
  return (
    <motion.div
      className="container p-4 flex flex-col h-screen"
      variants={page}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <NavBar />
      <MainSection />
      <Footer />
    </motion.div>
  )
}
