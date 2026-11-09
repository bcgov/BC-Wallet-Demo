import { AnimatePresence, motion } from 'framer-motion'

import { standardFade, dropIn } from '../../../FramerAnimations'
import { SmallButton } from '../../../components/SmallButton'
import { SmallButtonText } from '../../../components/SmallButtonText'
export interface Props {
  action(): void
  cancel?(): void
}

export const DemoCompletedModal: React.FC<Props> = ({ action, cancel }) => {
  const TITLE = 'Showcase Completed!'
  const DESCRIPTION = 'Looking to leave some feedback? Take our survey and connect with us!'

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
            className="bg-bcgov-white dark:bg-bcgov-black inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:text-white border-t-8 border-bcgov-gold"
          >
            <div className="px-6 pt-8 pb-2 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-bcgov-gold bg-opacity-20 mb-4">
                <svg
                  className="h-9 w-9 text-bcgov-blue dark:text-bcgov-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 id="modal-title" className="text-2xl font-bold text-bcgov-blue dark:text-white">
                {TITLE}
              </h2>
              <p className="mt-3 text-sm text-bcgov-darkgrey dark:text-bcgov-lightgrey">{DESCRIPTION}</p>
              <a
                href="https://submit.digital.gov.bc.ca/app/form/submit?f=d61da710-acc3-46fc-b692-111cf6e348de"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-bcgov-blue dark:bg-bcgov-gold text-white dark:text-bcgov-black font-semibold my-6 py-3 px-10 rounded-full text-sm shadow-md hover:shadow-lg transition duration-300 ease-in-out"
                  data-cy="standard-button"
                >
                  {'Give feedback'}
                </motion.button>
              </a>
            </div>
            <div className="px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-bcgov-lightgrey dark:border-bcgov-darkgrey">
              <SmallButton onClick={action} text={'FINISH'} disabled={false} />
              {cancel && <SmallButtonText onClick={cancel} text={'CANCEL'} disabled={false} />}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
