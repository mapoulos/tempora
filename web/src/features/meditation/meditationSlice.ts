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
	const meditations = await fetchPublicMeditations()
	dispatch(setMeditations(meditations))
}

export const { setIsLoading, setMeditations } = meditationsSlice.actions

export const selectPublicMeditations = (state: RootState) => state.meditation.public.meditations

export default meditationsSlice.reducer