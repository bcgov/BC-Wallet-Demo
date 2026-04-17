export function CreatorPage() {
  return (
    <div className="container p-4 flex flex-col h-screen">
      <div className="flex flex-row my-8 md:pt-4 sm:my-4">
        <div className="flex-1" />
      </div>

      <div className="flex flex-col flex-grow items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-bcgov-black font-semibold text-3xl lg:text-4xl mb-4">Admin Portal</h1>
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
