export const DEFAULT_ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=ca.bc.gov.id.servicescard'
export const DEFAULT_APPLE_APP_URL = 'https://apps.apple.com/us/app/bc-services-card/id1234298467'

export interface AppStoreLinks {
  android: string
  apple: string
}

export type AppStorePlatform = 'android' | 'apple'

export const getAppStoreLinks = (): AppStoreLinks => ({
  android: process.env.ANDROID_APP_STORE_URL || DEFAULT_ANDROID_APP_URL,
  apple: process.env.APPLE_APP_STORE_URL || DEFAULT_APPLE_APP_URL,
})

export const getAppStoreRedirectUrl = (
  userAgent: string | undefined,
  links: AppStoreLinks = getAppStoreLinks(),
  platform?: AppStorePlatform,
): string => {
  if (platform) {
    return links[platform]
  }

  const appleMatchers = [/iPhone/i, /iPad/i, /iPod/i]
  const isApple = appleMatchers.some((matcher) => userAgent?.match(matcher))

  return isApple ? links.apple : links.android
}
