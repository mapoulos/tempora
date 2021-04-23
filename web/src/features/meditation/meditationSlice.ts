import { AnyAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { fetchPublicMeditations, Meditation } from "./meditationService";
import { ThunkAction } from "redux-thunk";
import { Duration } from "luxon";

interface MeditationState {
  public: {
    meditations: Meditation[];
    isMeditationsLoading: boolean;
  };
  current?: Meditation;
  session: {
    length: number;
  };
}

const DEFAULT_SESSION_LENGTH = Duration.fromObject({ minutes: 20 }).toMillis();

const getInitialSessionLength = (): number => {
  try {
    const savedDuration = localStorage.getItem("sessionLength");
    if (!savedDuration) {
      return DEFAULT_SESSION_LENGTH;
    }
    const durationInMillis = parseInt(savedDuration);
    return durationInMillis;
  } catch (err) {
    return DEFAULT_SESSION_LENGTH;
  }
};

const updateSessionLengthInLocalStorage = (durationInMillis: number) => {
	localStorage.setItem("sessionLength", durationInMillis.toString())
}

const initialState: MeditationState = {
  public: {
    meditations: [],
    isMeditationsLoading: true,
  },
  session: {
    length: getInitialSessionLength(),
  },
};

const meditationsSlice = createSlice({
  name: "meditation",
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.public.isMeditationsLoading = action.payload;
    },
    setMeditations: (state, action: PayloadAction<Meditation[]>) => {
      state.public.meditations = [...action.payload];
    },
    setCurrentMeditation: (state, action: PayloadAction<Meditation>) => {
      state.current = action.payload;
    },
    setSessionLengthInMilliseconds: (state, action: PayloadAction<number>) => {
      state.session.length = action.payload;
    },
  },
});

export const fetchPublicMeditationsThunk = (): ThunkAction<
  void,
  RootState,
  unknown,
  AnyAction
> => async (dispatch) => {
  try {
    const meditations = await fetchPublicMeditations();
    dispatch(setMeditations(meditations));
    dispatch(setCurrentMeditation(meditations[0]));
    dispatch(setIsLoading(false));
  } catch (error) {
    console.error("Problem loading public meditations");
    console.error(error);
  }
};

export const updateSessionLength = (
  durationInMillis: number
): ThunkAction<void, RootState, unknown, AnyAction> => async (dispatch) => {
	try {
		updateSessionLengthInLocalStorage(durationInMillis)
	} catch (error) {

	}
	dispatch(setSessionLengthInMilliseconds(durationInMillis))
};

export const {
  setIsLoading,
  setMeditations,
  setCurrentMeditation,
  setSessionLengthInMilliseconds,
} = meditationsSlice.actions;

export const selectPublicMeditations = (state: RootState) =>
  state.meditation.public.meditations;
export const selectCurrentMeditation = (state: RootState) =>
  state.meditation.current || null;
export const selectIsPublicMeditationsLoading = (state: RootState) =>
  state.meditation.public.isMeditationsLoading;
export const selectSessionLength = (state: RootState) =>
  state.meditation.session.length;
export default meditationsSlice.reducer;
