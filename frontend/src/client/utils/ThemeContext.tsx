import type { ReactNode } from 'react'

import { createContext } from 'react'

import { usePreferences } from '../slices/preferences/preferencesSelectors'

export const ThemeContext = createContext({ darkMode: false })

export function ThemeProvider(props: { children: ReactNode }) {
  const { darkMode } = usePreferences()

  return <ThemeContext.Provider value={{ darkMode }}>{props.children}</ThemeContext.Provider>
}
