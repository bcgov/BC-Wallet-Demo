import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useShowcases = () => useSelector((state: RootState) => state.showcases)
export const useCurrentPersona = () => useSelector((state: RootState) => state.showcases.currentPersona)
