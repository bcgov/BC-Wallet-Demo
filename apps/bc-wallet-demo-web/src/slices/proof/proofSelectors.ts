import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useProof = () => useSelector((state: RootState) => state.proof)
