export function ErrorModal({
  errorText,
  setShowModal,
}: {
  errorText: string
  setShowModal: (showModal: boolean) => void
}) {
  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none backdrop-blur">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
              <h3 className="text-3xl font-semibold">Error</h3>
            </div>

            <div className="relative p-6 flex-auto">
              <p className="text-slate-800 text-lg leading-relaxed">
                Oops, the showcase creator UI encountered an error.
                <br />
              </p>
              <p className="italic text-slate-500">{errorText}</p>
            </div>

            <div className="flex items-center justify-center p-6 border-t border-solid border-slate-200 rounded-b">
              <button
                className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  )
}
