import type { ReactChild, ReactFragment, ReactPortal } from 'react'

import { createContext } from 'react'

import { useIntroduction } from '../slices/introduction/introductionSelectors'

export const AuthContext = createContext({ auth: false })

export const AuthProvider = (props: {
  children: boolean | ReactChild | ReactFragment | ReactPortal | null | undefined
}) => {
  const { isCompleted } = useIntroduction()

  return <AuthContext.Provider value={{ auth: isCompleted }}>{props.children}</AuthContext.Provider>
}
