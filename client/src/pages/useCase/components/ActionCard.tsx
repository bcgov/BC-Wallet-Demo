import { startCase } from 'lodash'
import React from 'react'

import { prependApiUrl } from '../../../utils/Url'

export interface Item {
  icon: string
  name: string
}

export interface Props {
  title: string
  items: { name: string; icon?: string }[]
}

export const ActionCard: React.FC<Props> = ({ items, title }) => {
  return items.length > 0 ? (
    <div className="flex flex-col bg-white dark:bg-bcgov-black m-4 px-4 py-2 w-72 md:w-96 rounded-lg shadow border border-1 border-bcgov-lightgrey dark:border-bcgov-darkgrey">
      <div className="flex-1-1 title my-2 ">
        <h1 className="font-semibold dark:text-white">{title}</h1>
        <hr className="text-bcgov-lightgrey" />
      </div>
      {items.map((item) => {
        return (
          <div className="flex-1 flex flex-row items-center justify-between my-2" key={item.name}>
            {item.icon && (
              <div className="bg-bcgov-lightgrey dark:bg-bcgov-darkgrey rounded-lg p-2 w-12">
                <img className="h-8 m-auto" src={prependApiUrl(item.icon)} alt="icon" />
              </div>
            )}
            <div className="flex-1 px-4 justify-self-start dark:text-white">
              <p>{startCase(item.name)}</p>
            </div>
          </div>
        )
      })}
    </div>
  ) : null
}
