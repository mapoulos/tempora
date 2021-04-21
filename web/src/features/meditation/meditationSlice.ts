import { AnyAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { fetchPublicMeditations, Meditation } from './meditationService'
import { ThunkAction } from 'redux-thunk'
import { Duration } from 'luxon'

interface MeditationState {
	public: {
		meditations: Meditation[],
		isMeditationsLoading: boolean
	},
	session: {
		length: number
	}
}

const initialState: MeditationState = {
	public: {
		meditations: [],
		isMeditationsLoading: true,
	},
	session: {
		length: Duration.fromObject({seconds: 42}).toMillis()
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
export const selectCurrentMeditation = (state: RootState) => state.meditation.public.meditations[13] || null
export const selectIsPublicMeditationsLoading = (state: RootState) => state.meditation.public.isMeditationsLoading
export const selectSessionLength = (state: RootState) => state.meditation.session.length
export default meditationsSlice.reducer