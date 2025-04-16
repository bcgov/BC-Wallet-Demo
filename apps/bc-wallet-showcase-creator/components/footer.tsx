import { useTranslations } from 'next-intl'

export const Footer = () => {
  const t = useTranslations()
  return (
    <footer className="py-2 bg-light-bg-secondary dark:bg-dark-bg-secondary  dark:text-dark-text text-center relative bottom-0 left-0 w-full">
      <p>
        &copy; {new Date().getFullYear()} {t('footer.copyright_label')}
      </p>
    </footer>
  )
}
