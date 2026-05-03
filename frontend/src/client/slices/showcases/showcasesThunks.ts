import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ShowcaseApi'

export const fetchAllShowcases = createAsyncThunk('showcases/fetchAll', async () => {
  const response = await Api.getShowcases()
  return response.data
})

export const fetchShowcaseById = createAsyncThunk('showcases/fetchById', async (id: string) => {
  const response = await Api.getShowcaseById(id)
  return response.data
})
