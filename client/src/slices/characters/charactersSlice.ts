import type { CustomCharacter } from '../types'
import type { PayloadAction } from '@reduxjs/toolkit'

import { createSlice } from '@reduxjs/toolkit'

import { getOrCreateCredDefId } from '../../api/CredentialApi'

import { fetchAllCharacters, fetchCharacterById } from './charactersThunks'

interface CharactersState {
  characters: CustomCharacter[]
  uploadedCharacter?: CustomCharacter
  currentCharacter?: CustomCharacter
  isUploading: boolean
  isLoading: boolean
}

const initialState: CharactersState = {
  characters: [],
  uploadedCharacter: undefined,
  currentCharacter: undefined,
  isUploading: false,
  isLoading: false,
}

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    uploadCharacter: (state, action: PayloadAction<{ character: CustomCharacter; callback?: () => void }>) => {
      state.uploadedCharacter = action.payload.character
      const promises: Promise<any>[] = []
      state.isUploading = true
      action.payload.character.onboarding
        .filter((screen) => screen.credentials)
        .forEach((screen) => screen.credentials?.forEach((cred) => promises.push(getOrCreateCredDefId(cred))))
      Promise.all(promises).then(() => {
        if (action.payload.callback) {
          action.payload.callback()
        }
      })
    },
    setUploadingStatus: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setCharacter: (state, action: PayloadAction<CustomCharacter>) => {
      state.currentCharacter = action.payload
    },
    removeCharacter: (state) => {
      state.currentCharacter = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCharacters.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAllCharacters.fulfilled, (state, action) => {
        state.isLoading = false
        state.characters = action.payload
      })
      .addCase(fetchCharacterById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCharacterById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentCharacter = action.payload
      })
  },
})

export const { setCharacter, removeCharacter, uploadCharacter, setUploadingStatus } = characterSlice.actions

export default characterSlice.reducer
