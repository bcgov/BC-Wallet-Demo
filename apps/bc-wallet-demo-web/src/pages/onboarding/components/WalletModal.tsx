import { AnimatePresence, motion } from 'framer-motion'

import { demoBackendBaseUrl } from '../../../api/BaseUrl'
import appStore from '../../../assets/light/app-store-badge.svg'
import playStore from '../../../assets/light/google-play-badge.png'
import { SmallButton } from '../../../components/SmallButton'
import { dropIn, standardFade } from '../../../FramerAnimations'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require('qrcode.react')

export interface Wallet {
  id: number
  name: string
  icon: string
  url: string
  apple: string
  android: string
  ledgerImage?: string
}

export interface Props {
  isWalletModalOpen: boolean
  setIsWalletModalOpen: (open: boolean) => void
  onCompleted(): void
}

export const WalletModal: React.FC<Props> = ({ isWalletModalOpen, setIsWalletModalOpen, onCompleted }) => {
  function isMobile() {
    return window.innerWidth <= 760
  }
  return (
    <AnimatePresence>
      {isWalletModalOpen && (
        <motion.div
          variants={standardFade}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              onClick={() => setIsWalletModalOpen(false)}
              className="fixed inset-0 bg-bcgov-black bg-opacity-50 transition-opacity z-0"
              aria-hidden="true"
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true" />

            <motion.div
              variants={dropIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-bcgov-white z-40 dark:bg-bcgov-black inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-xl sm:w-full dark:text-white"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div className="px-2 md:px-6 pt-2 sm:mt-4 sm:pb-4">
                  <div className="mt-5">
                    <p className="font-semibold">1. Download BC Wallet on your phone</p>
                    <p className="mt-5 mb-5">
                      To download,{' '}
                      {isMobile()
                        ? 'select the apps store icon below'
                        : 'scan this QR code with your phone or select the apps store icon below'}
                      . You can also search for BC Wallet in your phone's apps store.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: isMobile() ? 'column' : 'row',
                        marginBottom: '10px',
                      }}
                    >
                      <a href="https://apps.apple.com/us/app/bc-wallet/id1587380443" target="_blank">
                        <img
                          src={appStore}
                          style={
                            isMobile()
                              ? { width: '200px', marginBottom: '10px' }
                              : { height: '50px', marginRight: '10px' }
                          }
                          alt="app store"
                        />
                      </a>
                      <a href="https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet" target="_blank">
                        <img
                          src={playStore}
                          style={isMobile() ? { width: '200px' } : { height: '50px' }}
                          alt="google play store"
                        />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">2. Complete the setup</p>
                    <p className="mt-5">Complete the onboarding process in the app.</p>
                  </div>
                </div>
                {!isMobile() && (
                  <div className="mt-10 mr-10">
                    <QRCode value={`${demoBackendBaseUrl}/qr`} size={125} />
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 flex justify-end">
                <SmallButton onClick={onCompleted} text={'I HAVE MY WALLET'} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
