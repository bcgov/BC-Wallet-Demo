'use client'

import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export const NavBarButton = ({ src, title, page }: { src: string; title: string; page: string }) => {
  const currentPage = usePathname()

  return (
    <Link href={page}>
      <li
        className={`flex flex-col  items-center justify-between p-3 ${currentPage === page ? 'bg-yellow-400' : ''} ${
          currentPage === page ? 'text-light-text' : ''
        } rounded-b-lg bg-slate-900  hover:yellow cursor-pointer hover:text-black`}
        style={{
          width: '106px',
          height: '93px',
          padding: '13px, 0px, 13px, 0px',
        }}
      >
        <div
          className="rounded-full flex justify-center items-center"
          style={{
            backgroundColor: '#D9D9D9',
            boxSizing: 'border-box',
            width: '45px',
            height: '45px',
          }}
        >
          <Image src={src} alt={title} width={25} height={25} className="w-45 h-45 text-xs text-gray-500" />
        </div>

        <p className={`font-bold text-xs text-center  ${currentPage === page ? 'text-black' : 'text-white'}`}>
          {title}
        </p>
      </li>
    </Link>
  )
}
