import type { RootState } from '../../store/configureStore'

import { useSelector } from 'react-redux'

export const useShowcases = () => useSelector((state: RootState) => state.showcases)
export const useCurrentShowcase = () => useSelector((state: RootState) => state.showcases.currentShowcase)
