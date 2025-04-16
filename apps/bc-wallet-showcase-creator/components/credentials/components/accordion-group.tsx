import { useState } from 'react'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

import CredentialStep from '../../../assets/credential-step.png'

interface AccordionItemProps {
  title: string | React.ReactNode
  content: string | React.ReactNode
  value: number
  selectedValue: number | null
  setSelectedValue: (value: number | null) => void
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, content, value, selectedValue, setSelectedValue }) => {
  const isOpen = selectedValue === value

  const toggle = () => {
    setSelectedValue(isOpen ? null : value)
  }

  return (
    <li className="relative  border-b border-gray-200 dark:border-dark-border">
      <button
        type="button"
        className="w-full px-4 py-4 text-left bg-gray-50 dark:bg-dark-input focus:outline-none"
        onClick={toggle}
      >
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </button>
      <div
        className="relative overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '9999px' : '0', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-6 pb-6 pt-4">{content}</div>
      </div>
    </li>
  )
}

const Accordion = () => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const t = useTranslations()

  const accordionItems = [
    {
      title: <div className="flex items-start font-semibold space-x-4">{t('credentials.step1_title')}</div>,
      content: (
        <>
          <div className="flex items-start space-x-4">
            <div className="px-3 py-0.5 bg-[#003366] rounded-[5px] gap-2.5 inline-flex">
              <div className="text-white text-base font-semibold ">1</div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-md font-semibold">{t('credentials.step1_description')}</h3>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {t('credentials.step1_link_description')}{' '}
                <a
                  href="https://candyscan.idlab.org/txs/CANDY_PROD/domain"
                  className="text-[#003366] underline font-semibold dark:text-[#255A90]"
                >
                  {t('credentials.step1_link_text')}
                </a>
              </p>
            </div>
          </div>
        </>
      ),
      value: 1,
    },
    {
      title: <div className="flex items-start font-semibold space-x-4">{t('credentials.step2_title')}</div>,
      content: (
        <>
          <div className="flex items-start space-x-4">
            <div className="px-3 py-0.5 bg-[#003366] rounded-[5px] gap-2.5 inline-flex">
              <div className="text-white text-base font-semibold ">2</div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-md font-semibold">{t('credentials.step2_description')}</h3>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">{t('credentials.step2_details')}</p>
            </div>
          </div>
        </>
      ),
      value: 2,
    },
    {
      title: <div className="flex items-start font-semibold space-x-4">{t('credentials.step3_title')}</div>,
      content: (
        <>
          <div className="flex items-start space-x-4">
            <div className="px-3 py-0.5 bg-[#003366] rounded-[5px] gap-2.5 inline-flex">
              <div className="text-white text-base font-semibold ">3</div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-md font-semibold">{t('credentials.step3_description')}</h3>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">{t('credentials.step3_details')}</p>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold mt-4">{t('credentials.step3_credential_id_label')}</h3>
                <p className="text-sm font-normal dark:text-gray-400 text-gray-500">
                  Format: TxID:3&lt;definition&gt;
                  <br />
                  <span className="italic">{t('credentials.step3_credential_id_note')}</span>
                </p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold mt-4">{t('credentials.step3_schema_id_label')}</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Format: TxID:3:&lt;schema-name&gt;:&lt;version&gt;
                  <br />
                  <span className="italic">{t('credentials.step3_schema_id_note')}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <Image src={CredentialStep} alt="CandyScan" />
            </div>
          </div>
        </>
      ),
      value: 3,
    },
    {
      title: <div className="flex items-start font-semibold space-x-4">{t('credentials.step4_title')}</div>,
      content: (
        <>
          <div className="flex items-start space-x-4">
            <div className="px-3 py-0.5 bg-[#003366] rounded-[5px] gap-2.5 inline-flex">
              <div className="text-white text-base font-semibold ">4</div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-md font-semibold">{t('credentials.step4_description')}</h3>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">{t('credentials.step4_details')}</p>
            </div>
          </div>
        </>
      ),
      value: 4,
    },
  ]

  return (
    <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200  dark:border-dark-border">
      <ul className="shadow-box">
        {accordionItems.map((item) => (
          <AccordionItem
            key={item.value}
            title={item.title}
            content={item.content}
            value={item.value}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
        ))}
      </ul>
    </div>
  )
}

export default Accordion
