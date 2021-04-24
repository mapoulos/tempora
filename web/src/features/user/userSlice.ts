import { AnyAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ThunkAction } from "redux-thunk";
import { IdToken } from "@auth0/auth0-spa-js";

interface UserState {
  idToken?: IdToken;
}

export const getIdToken = (
  getFn: () => Promise<IdToken>
): ThunkAction<void, RootState, unknown, AnyAction> => async (dispatch) => {
  try {
    const idToken = await getFn();
    dispatch(setIdToken(idToken));
  } catch (error) {
    console.error("Problem loading id token");
  }
};

const initialState: UserState = {};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setIdToken: (state, action: PayloadAction<IdToken>) => {
      state.idToken = action.payload;
    },
  },
});

export const { setIdToken } = userSlice.actions;
export const selectIdToken = (state: RootState) =>
  state.user.idToken;

export default userSlice.reducer