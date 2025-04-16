import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useWallets = () => useSelector((state: RootState) => state.wallets)
