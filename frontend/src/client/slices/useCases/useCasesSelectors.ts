import type { RootState } from '../../store/configureStore'

import { useSelector } from 'react-redux'

export const useUseCaseState = () => useSelector((state: RootState) => state.useCases)
