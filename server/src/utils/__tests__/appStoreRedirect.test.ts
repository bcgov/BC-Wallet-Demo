import {
  DEFAULT_ANDROID_APP_URL,
  DEFAULT_APPLE_APP_URL,
  getAppStoreRedirectUrl,
} from '../appStoreRedirect'

describe('getAppStoreRedirectUrl', () => {
  it('redirects Android clients to Google Play by default', () => {
    expect(getAppStoreRedirectUrl('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(DEFAULT_ANDROID_APP_URL)
  })

  it('redirects Apple clients to the App Store by default', () => {
    expect(getAppStoreRedirectUrl('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)')).toBe(DEFAULT_APPLE_APP_URL)
  })

  it('uses Google Play for unknown clients', () => {
    expect(getAppStoreRedirectUrl('Mozilla/5.0 (X11; Linux x86_64)')).toBe(DEFAULT_ANDROID_APP_URL)
  })

  it('supports configured store URLs', () => {
    expect(
      getAppStoreRedirectUrl('Mozilla/5.0 (Linux; Android 14)', {
        android: 'https://example.com/android',
        apple: 'https://example.com/apple',
      }),
    ).toBe('https://example.com/android')
  })

  it('honors an explicit platform for store badge links', () => {
    const links = { android: 'https://example.com/android', apple: 'https://example.com/apple' }

    expect(getAppStoreRedirectUrl('Mozilla/5.0 (X11; Linux x86_64)', links, 'apple')).toBe('https://example.com/apple')
  })
})
