import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Search, CirclePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Input } from '../components/ui/input'
import { Button } from './ui/button'
// import { useSession } from "next-auth/react"

interface HeaderProps {
  title: string
  showSearch?: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  buttonLabel?: string
  buttonLink?: string | ((event: React.MouseEvent<HTMLButtonElement>) => void)
  buttonBgColor?: string
  buttonTextColor?: string
  showIcon?: boolean
  buttonClasses?: string
}

const Header: React.FC<HeaderProps> = ({
  title,
  showSearch = true,
  searchTerm = '',
  setSearchTerm,
  buttonLabel,
  buttonLink,
  buttonBgColor = 'bg-yellow-500 hover:bg-yellow-600',
  buttonTextColor = 'text-black',
  showIcon = true,
  buttonClasses = '',
}) => {
  const t = useTranslations()
  // const session = useSession()
  return (
    <section className="w-full px-0 pt-2 bg-cover bg-center dark:bg-dark-bg">
      <div className="mx-auto px-4 mt-6 mb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
      </div>
      <div className="mx-auto px-4 mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-lg sm:max-w-lg">
          {showSearch && (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
              <Input
                type="text"
                placeholder={t('action.search_label')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 border border-foreground/50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-100"
              />
            </>
          )}
        </div>

        {buttonLabel &&
          buttonLink &&
          (typeof buttonLink === 'string' ? (
            <Link href={buttonLink}>
              <Button
                className={cn(
                  'font-bold flex items-center gap-4 shadow-md',
                  buttonBgColor,
                  buttonTextColor,
                  buttonClasses,
                  'bg-transparent border-2 dark:border-yellow-500 border-amber-500 text-amber-500 dark:text-yellow-500 hover:bg-amber-500 dark:hover:bg-yellow-500 hover:text-background dark:hover:text-background'
                )}
                variant="outline"
              >
                {buttonLabel} {showIcon && <CirclePlus size={22} />}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={buttonLink}
              className={cn(
                'font-bold flex items-center gap-4 shadow-md',
                buttonBgColor,
                buttonTextColor,
                buttonClasses
              )}
            >
              {buttonLabel} {showIcon && <CirclePlus size={22} />}
            </Button>
          ))}
      </div>
    </section>
  )
}

export default Header
