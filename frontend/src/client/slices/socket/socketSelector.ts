import type { RootState } from '../../store/configureStore'

import { useSelector } from 'react-redux'

export const useSocket = () => useSelector((state: RootState) => state.socket)
