import React from 'react'

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-md z-50">
      <div className="flex flex-col items-center">
        {/* Spinner Animation */}
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>

        {/* Loading Text */}
        <p className="mt-3 text-white text-lg font-medium">{text}</p>
      </div>
    </div>
  )
}

export default Loader
