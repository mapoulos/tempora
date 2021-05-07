import { AnyAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  fetchPublicMeditations,
  Meditation,
  fetchPrivateMeditations,
  createMeditation,
  CreateMeditationInput,
  deleteMeditationById,
  updateMeditation,
  UpdateMeditationInput,
} from "./meditationService";
import { ThunkAction } from "redux-thunk";
import { Duration } from "luxon";
import { IdToken } from "@auth0/auth0-spa-js";

interface MeditationState {
  public: {
    meditations: Meditation[];
    isMeditationsLoading: boolean;
  };
  private: {
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
  localStorage.setItem("sessionLength", durationInMillis.toString());
};

const initialState: MeditationState = {
  public: {
    meditations: [],
    isMeditationsLoading: true,
  },
  private: {
    meditations: [],
    isMeditationsLoading: false,
  },
  session: {
    length: getInitialSessionLength(),
  },
};

const meditationsSlice = createSlice({
  name: "meditation",
  initialState,
  reducers: {
    setIsPublicMeditationsLoading: (state, action: PayloadAction<boolean>) => {
      state.public.isMeditationsLoading = action.payload;
    },
    setPublicMeditations: (state, action: PayloadAction<Meditation[]>) => {
      state.public.meditations = [...action.payload];
    },
    setIsPrivateMeditationsLoading: (state, action: PayloadAction<boolean>) => {
      state.private.isMeditationsLoading = action.payload;
    },
    setPrivateMeditations: (state, action: PayloadAction<Meditation[]>) => {
      state.private.meditations = [...action.payload];
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
  Promise<void>,
  RootState,
  unknown,
  AnyAction
> => async (dispatch) => {
  dispatch(setIsPublicMeditationsLoading(true));
  const meditations = await fetchPublicMeditations();
  dispatch(setPublicMeditations(meditations));
  dispatch(setCurrentMeditation(meditations[0]));
  dispatch(setIsPublicMeditationsLoading(false));

};

export const fetchPrivateMeditationsThunk = (
  token: IdToken
): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => async (dispatch, getState) => {
  // dispatch(setIsPrivateMeditationsLoading(true));
  const meditations = await fetchPrivateMeditations(token);
  dispatch(setPrivateMeditations(meditations));
  dispatch(setIsPrivateMeditationsLoading(false));
};

export const createMeditationThunk = (
  meditation: CreateMeditationInput,
  idToken: IdToken
): ThunkAction<Promise<Meditation>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<Meditation> => {
    const newMeditation = await createMeditation(meditation, idToken);
    const existingMeditations = getState().meditation.private.meditations;
    dispatch(setPrivateMeditations([newMeditation, ...existingMeditations]));
    if (newMeditation.isPublic) {
      await dispatch(fetchPublicMeditationsThunk())
    }
    return newMeditation;
  };

export const updateMeditationThunk = (
  meditation: UpdateMeditationInput,
  idToken: IdToken
): ThunkAction<Promise<Meditation>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<Meditation> => {
    const newMeditation = await updateMeditation(meditation, idToken);
    const existingMeditations = getState().meditation.private.meditations;
    const i = existingMeditations.findIndex((m) => m._id === meditation._id)

    if (i >= 0) {
      const privateMeditations = [...existingMeditations.slice(0, i), ...existingMeditations.slice(i + 1)]
      dispatch(setPrivateMeditations(privateMeditations));
    }
    if (newMeditation.isPublic) {
      await dispatch(fetchPublicMeditationsThunk())
    }
    return newMeditation;
  };

export const deleteMeditationThunk = (
  meditationId: string,
  idToken: IdToken
): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<void> => {
    await deleteMeditationById(meditationId, idToken);
    const existingPrivateMeditations = getState().meditation.private.meditations;
    const existingPublicMeditations = getState().meditation.public.meditations;

    const newPrivateMeditations = existingPrivateMeditations.filter((m) => m._id !== meditationId)
    const newPublicMeditations = existingPublicMeditations.filter((m) => m._id !== meditationId)
    dispatch(setPrivateMeditations(newPrivateMeditations))
    dispatch(setPublicMeditations(newPublicMeditations))
  };

export const updateSessionLength = (
  durationInMillis: number
): ThunkAction<void, RootState, unknown, AnyAction> => async (dispatch) => {
  try {
    updateSessionLengthInLocalStorage(durationInMillis);
  } catch (error) { }
  dispatch(setSessionLengthInMilliseconds(durationInMillis));
};

export const {
  setIsPublicMeditationsLoading,
  setIsPrivateMeditationsLoading,
  setPublicMeditations,
  setPrivateMeditations,
  setCurrentMeditation,
  setSessionLengthInMilliseconds,
} = meditationsSlice.actions;

export const selectPublicMeditations = (state: RootState) =>
  state.meditation.public.meditations;
export const selectPrivateMeditations = (state: RootState) =>
  state.meditation.private.meditations;
export const selectCurrentMeditation = (state: RootState) =>
  state.meditation.current || null;
export const selectIsPublicMeditationsLoading = (state: RootState) =>
  state.meditation.public.isMeditationsLoading;
export const selectIsPrivateMeditationsLoading = (state: RootState) =>
  state.meditation.private.isMeditationsLoading;
export const selectSessionLength = (state: RootState) =>
  state.meditation.session.length;
export default meditationsSlice.reducer;
