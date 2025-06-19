export default function InvalidTenantPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-black px-4">
      <div className="flex items-center space-x-6 border-r border-white pr-6">
        <h1 className="text-3xl font-semibold text-white">404</h1>
      </div>
      <div className="pl-6">
        <h2 className="text-sm font-normal text-white">
          The tenant could not be found.
        </h2>
      </div>
    </div>
  )
}
