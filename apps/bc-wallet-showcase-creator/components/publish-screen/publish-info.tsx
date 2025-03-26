'use client'

import { ensureBase64HasPrefix } from '@/lib/utils'
import type { Persona, Credential } from '@/openapi-types'

import Image from 'next/image'

export const PublishInfo = ({
  characters,
  credentials,
}: {
  characters: Partial<Persona>[]
  credentials: Partial<Credential>[]
}) => {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text">
      <div className="flex flex-col gap-4">
        {(characters || []).map((char, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-6 flex flex-col">
            {/* Character Header */}
            <div className="flex items-center gap-4">
              <Image
                src={ensureBase64HasPrefix(char.headshotImage?.content) || '/assets/NavBar/Joyce.png'}
                alt={char.name || 'Character'}
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{char.name}</h3>
                <p className="text-gray-500 text-sm">{char.role}</p>
              </div>
            </div>

            {/* Credential Section */}
            <div className="mt-4 border-l-[16px] border  border-border-light border-l-light-yellow bg-gray-50 dark:bg-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-white">Will receive the following credential(s):</p>

              <div className="mt-3 space-y-3">
                {credentials?.map((cred, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Image
                      src={ensureBase64HasPrefix(cred.icon?.content) || '/assets/NavBar/Joyce.png'}
                      alt={cred.icon?.description || 'Credential'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{cred.name}</p>
                      <p className="text-gray-500 text-sm">{'Test college'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
