import { Trash2 } from 'lucide-react'

export const Layouts = () => {
  return (
    <>
      <div className="flex m-20 gap-5">
        <div className="w-2/5 bg-gray-300 rounded">
          <div className="credential-container border">
            {/* <div className="credential rounded grid grid-cols-3"> */}
            <div className="flex">
              <div className="credential rounded w-4/5">
                <div className="col-span-2">
                  <div className="credential-issuer-name">
                    <p>Government of British Columbia</p>
                  </div>
                  <div className="credential-credential-name">
                    <p>Person Card</p>
                  </div>
                  <div className="credential-attributes">
                    <p>Attributes : 0</p>
                  </div>
                </div>
              </div>
              <div className="remove col-span-1 flex items-center justify-center w-1/5">
                <Trash2 />
              </div>
            </div>
          </div>
        </div>
        {/* End of col 1  */}
        <div className="w-3/5 bg-gray-300 px-16 py-10 rounded-md right-col ">
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-slate-100 text-sm">Creating a new credential</p>
              <h3 className="text-3xl font-bold text-slate-50">Add Credential</h3>
            </div>
          </div>
          <hr className="mb-6"></hr>
          <label className="text-slate-50" htmlFor="cred_name">
            Credential Name
          </label>
          <br />
          <input type="text" id="cred_name" name="cred_name" placeholder="Credential Name" value="Person Card" />
          <br />
          <label className="text-slate-50" htmlFor="issuer_name">
            Issuer Name
          </label>
          <br />
          <input
            type="text"
            id="issuer_name"
            name="issuer_name"
            placeholder="Issuer Name"
            value="Governement of British Columbia"
          />
          <br />
          <label className="text-slate-50"> Add Attributes</label>
          <br />
        </div>
        {/* End of col 2  */}
      </div>
    </>
  )
}
