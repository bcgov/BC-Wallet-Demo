import { combineReducers } from 'redux'

import charactersSlice from './characters/charactersSlice'
import connectionSlice from './connection/connectionSlice'
import credentialsSlice from './credentials/credentialsSlice'
import introductionSlice from './introduction/introductionSlice'
import preferencesSlice from './preferences/preferencesSlice'
import proofSlice from './proof/proofSlice'
import sectionSlice from './section/sectionSlice'
import socketSlice from './socket/socketSlice'
import useCaseSlice from './useCases/useCasesSlice'
import walletsSlice from './wallets/walletsSlice'

export const VERSION = 5

const rootReducer = combineReducers({
  socket: socketSlice,
  wallets: walletsSlice,
  characters: charactersSlice,
  connection: connectionSlice,
  credentials: credentialsSlice,
  introduction: introductionSlice,
  preferences: preferencesSlice,
  proof: proofSlice,
  section: sectionSlice,
  useCases: useCaseSlice,
})

const pReducer = (state: any, action: any) => {
  // Strip redux-persist's internal _persist key before passing to combineReducers
  // so that it never warns about an unexpected key in the state shape.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _persist, ...restState } = state ?? {}

  if (action.type === 'persist/REHYDRATE') {
    const storageVersion = action.payload?._persist?.version

    if (storageVersion !== VERSION) {
      return rootReducer(undefined, action)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _persist: _p, ...rehydratedState } = action.payload ?? {}
    return rootReducer(rehydratedState, action)
  }

  if (action.type === 'demo/RESET') {
    return rootReducer(undefined, action)
  }

  return rootReducer(state === undefined ? undefined : restState, action)
}

export default pReducer
