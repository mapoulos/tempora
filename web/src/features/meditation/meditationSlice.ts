import { AnyAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { fetchPublicMeditations, Meditation } from './meditationService'
import { ThunkAction } from 'redux-thunk'

interface MeditationState {
	public: {
		meditations: Meditation[],
		isMeditationsLoading: boolean
	}
}

const initialState: MeditationState = {
	public: {
		meditations: [],
		isMeditationsLoading: true,
	}
}

const meditationsSlice = createSlice({
	name: 'meditation',
	initialState,
	reducers: {
		setIsLoading: (state, action: PayloadAction<boolean>) => {
			state.public.isMeditationsLoading = action.payload
		},
		setMeditations: (state, action: PayloadAction<Meditation[]>) => {
			state.public.meditations = [...action.payload]
		}
	}
})

export const fetchPublicMeditationsThunk = (): ThunkAction<void, RootState, unknown, AnyAction> => async dispatch => {
	try {
		const meditations = await fetchPublicMeditations()
		dispatch(setMeditations(meditations))
		dispatch(setIsLoading(false))
	} catch(error) {
		console.error("Problem loading public meditations")
		console.error(error)
	}
}

export const { setIsLoading, setMeditations } = meditationsSlice.actions

export const selectPublicMeditations = (state: RootState) => state.meditation.public.meditations
export const selectCurrentMeditation = (state: RootState) => state.meditation.public.meditations[0] || null
export const selectIsPublicMeditationsLoading = (state: RootState) => state.meditation.public.isMeditationsLoading

export default meditationsSlice.reducer