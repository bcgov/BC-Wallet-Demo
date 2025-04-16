import React, { useState } from 'react'
import { isBrowser } from 'react-device-detect'

import { motion, AnimatePresence } from 'framer-motion'

import { rowContainer } from '../../../../FramerAnimations'
import type { Wallet } from '../../../../slices/types'
import { useWallets } from '../../../../slices/wallets/walletsSelectors'
import { WalletItem } from '../../components/WalletItem'
import { WalletModal } from '../../components/WalletModal'

export interface Props {
  nextStep?: () => Promise<void>
}

export const ChooseWalletAction: React.FC<Props> = (props: Props) => {
  const { nextStep } = props
  const { wallets } = useWallets()
  const [isChooseWalletModalOpen, setIsChooseWalletModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(undefined)

  const openWalletModal = (id: number) => {
    setSelectedWallet(wallets.find((item) => item.id === id) || undefined)
    setIsChooseWalletModalOpen(true)
  }

  const renderWallets = wallets.map((wallet) => {
    return (
      <div className="flex justify-center" key={wallet.id} onClick={() => openWalletModal(wallet.id)}>
        <WalletItem
          name={wallet.name}
          icon={wallet.icon}
          organization={wallet.organization}
          recommended={wallet.recommended}
        />
      </div>
    )
  })

  const onCompleted = () => {
    setIsChooseWalletModalOpen(false)

    if (nextStep) {
      setTimeout(async () => {
        await nextStep()
      }, 300)
    }
  }

  const style = isBrowser ? { marginBottom: '1rem', maxHeight: '35vh' } : { maxHeight: '34vh' }

  return (
    <>
      <motion.div
        className="flex flex-col md:px-4 max-h-96 overflow-x-hidden"
        variants={rowContainer}
        initial="hidden"
        animate="show"
        exit="exit"
        style={style}
      >
        {renderWallets}
      </motion.div>
      <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
        {selectedWallet && (
          <WalletModal
            isWalletModalOpen={isChooseWalletModalOpen}
            setIsWalletModalOpen={setIsChooseWalletModalOpen}
            onCompleted={onCompleted}
          />
        )}
      </AnimatePresence>
    </>
  )
}
