import React from 'react'

export const Footer: React.FC = () => {
  // const darkMode = useDarkMode()

  return (
    <div>
      <div className="flex dark:text-white justify-center content-center mt-2 select-none">
        <a href="mailto:ditrust@gov.bc.ca">ditrust@gov.bc.ca</a>
      </div>
      <div className="flex dark:text-white justify-center content-center select-none">
        <p className="self-center mr-2 text-sm">Copyright &#169; 2026 Government of British Columbia</p>
      </div>
    </div>
  )
}
