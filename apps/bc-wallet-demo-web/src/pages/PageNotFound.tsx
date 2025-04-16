import React from 'react'
import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'

import { page } from '../FramerAnimations'
import { basePath } from '../utils/BasePath'

interface PageNotFoundProps {
  resourceType?: string
  resourceName?: string
}

export const PageNotFound: React.FC<PageNotFoundProps> = ({ resourceType, resourceName }) => {
  const navigate = useNavigate()

  // Original simple version when no resourceType/resourceName provided
  if (!resourceName) {
    return (
      <div className="flex h-screen">
        <div className="m-auto flex flex-col">
          <p className="text-6xl py-1.5 px-4">404</p>
          <h2 className="text-2xl font-semibold mb-6">{resourceType || 'Page'} Not Found</h2>
        </div>
      </div>
    )
  }

  // Enhanced version when resourceType is provided
  return (
    <motion.div
      variants={page}
      initial="hidden"
      animate="show"
      exit="exit"
      className="container flex flex-col items-center justify-center min-h-screen p-4"
    >
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">{resourceType || 'Page'} Not Found</h2>
        {resourceName && (
          <p className="mb-4">
            A {(resourceType || 'page').toLowerCase()} named "{resourceName}" could not be found.
          </p>
        )}
        <button
          onClick={() => navigate(`${basePath}/`)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    </motion.div>
  )
}
