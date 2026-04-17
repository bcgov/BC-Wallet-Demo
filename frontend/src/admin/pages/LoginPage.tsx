import { useAuth } from 'react-oidc-context'
import { useLocation } from 'react-router-dom'

import landingScreen from '../../client/assets/light/landing-screen.svg'

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const signedOut = new URLSearchParams(location.search).get('signedOut') === 'true'

  return (
    <div className="container p-4 flex flex-col h-screen">
      <div className="flex flex-row my-8 md:pt-4 sm:my-4">
        <div className="flex-1" />
      </div>
      {signedOut && (
        <div
          className="w-1/2 mx-auto rounded-lg px-4 py-3 mb-4 text-sm text-center"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.5)',
            color: '#7f1d1d',
          }}
        >
          You have been successfully signed out.
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-grow">
        <div className="flex-1 text-left text-bcgov-black font-semibold text-4xl lg:text-5xl xl:text-6xl m-auto">
          <div className="overflow-hidden py-1 leading-tight">
            <h1>BC Wallet Showcase</h1>
          </div>
          <div className="overflow-hidden">
            <p className="text-base lg:text-lg font-normal mt-6 text-bcgov-darkgrey">
              Administration portal for the BC Wallet Showcase.
            </p>
          </div>
          <div className="flex flex-row text-base font-normal mt-6">
            <button
              className="bg-bcgov-blue text-white py-3 px-5 rounded-lg font-semibold shadow-sm select-none"
              onClick={() => void auth.signinRedirect()}
            >
              Admin Log In
            </button>
          </div>
        </div>

        <div className="flex justify-center flex-grow">
          <img className="m-5 max-w-lg" src={landingScreen} alt="bc-wallet-showcase" />
        </div>
      </div>

      <div className="pb-4">
        <div className="flex justify-center text-bcgov-darkgrey mt-2 select-none">
          <a href="mailto:ditrust@gov.bc.ca">ditrust@gov.bc.ca</a>
        </div>
        <div className="flex justify-center select-none">
          <p className="self-center mr-2 text-sm text-bcgov-darkgrey">
            Copyright &#169; 2022 Government of British Columbia
          </p>
        </div>
      </div>
    </div>
  )
}
