import { configureStore } from '@reduxjs/toolkit'
import meditationReducer from '../features/meditation/meditationSlice'
import userReducer from '../features/user/userSlice'
const store = configureStore({
	reducer: {
		meditation: meditationReducer,
		user: userReducer
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store