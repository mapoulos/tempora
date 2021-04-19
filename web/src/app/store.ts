import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'
import meditationReducer from '../features/meditation/meditationSlice'

const store = configureStore({
	reducer: {
		counter: counterReducer,
		meditation: meditationReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store