import { AnimatePresence, motion } from 'framer-motion'

import { dropIn, standardFade } from '../FramerAnimations'

import { SmallButton } from './SmallButton'
import { SmallButtonText } from './SmallButtonText'

export interface Props {
  onOk(): void
  onCancel?(): void
  okDisabled?: boolean
  okText?: string
  children?: React.ReactNode
  title: string
  description: string
  loading?: boolean
  loadingText?: string
}

export const Modal: React.FC<Props> = ({
  onOk,
  onCancel,
  title,
  description,
  okDisabled,
  okText,
  children,
  loading,
  loadingText,
}) => {
  return (
    <AnimatePresence>
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
            className="fixed inset-0 bg-bcgov-black bg-opacity-70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true" />
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-bcgov-white dark:bg-bcgov-black inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:text-white border-t-8 border-bcgov-gold"
          >
            <div className="px-6 pt-6">
              <h2 id="modal-title" className="text-xl font-bold text-bcgov-blue dark:text-white">
                {title}
              </h2>
              <div className="mt-3">
                <p className="text-sm text-bcgov-darkgrey dark:text-bcgov-lightgrey leading-relaxed">{description}</p>
                {loading && loadingText && (
                  <p className="mt-2 text-sm font-medium text-bcgov-blue dark:text-bcgov-gold">{loadingText}</p>
                )}
              </div>
            </div>
            {children && <div className="px-6 py-6">{children}</div>}
            <div className="mt-4 px-4 py-4 sm:px-6 flex flex-row-reverse border-t border-bcgov-lightgrey dark:border-bcgov-darkgrey">
              <SmallButton onClick={onOk} text={okText ?? 'OK'} disabled={okDisabled || loading} loading={loading} />
              {onCancel && <SmallButtonText onClick={onCancel} text={'CANCEL'} disabled={false} />}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
