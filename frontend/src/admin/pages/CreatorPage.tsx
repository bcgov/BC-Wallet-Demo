import { useAuth } from 'react-oidc-context'

import { baseRoute } from '../../client/api/BaseUrl'

export function CreatorPage() {
  const auth = useAuth()

  const handleSignOut = () => {
    void auth.signoutRedirect({
      post_logout_redirect_uri: `${window.location.origin}${baseRoute}/admin?signedOut=true`,
    })
  }

  return (
    <div className="container p-4 flex flex-col h-screen">
      <div className="flex flex-row my-8 md:pt-4 sm:my-4">
        <div className="flex-1" />
        <button
          className="bg-bcgov-blue text-white py-2 px-4 rounded-lg font-semibold shadow-sm select-none"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      <div className="flex flex-col flex-grow items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-bcgov-black font-semibold text-3xl lg:text-4xl mb-4">Admin Portal</h1>
          {auth.user?.profile?.name && (
            <p className="text-bcgov-darkgrey text-lg mb-4">Welcome, {auth.user.profile.name}</p>
          )}
          <p className="text-bcgov-darkgrey text-base">Admin dashboard coming soon.</p>
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
