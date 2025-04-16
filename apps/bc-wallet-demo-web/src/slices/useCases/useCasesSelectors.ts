import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useUseCaseState = () => useSelector((state: RootState) => state.useCases)
