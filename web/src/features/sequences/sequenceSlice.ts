import { AnyAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

import { ThunkAction } from "redux-thunk";
import { IdToken } from "@auth0/auth0-spa-js";
import { createSequence, CreateSequenceInput, deleteSequenceById, fetchPrivateSequences, fetchPublicSequences, Sequence, updateSequence, UpdateSequenceInput } from "./sequenceService";

interface SequenceState {
  public: {
    sequences: Sequence[];
    isLoading: boolean;
  };
  private: {
    sequences: Sequence[];
    isLoading: boolean;
  };
  current?: Sequence;
}

const initialState: SequenceState = {
  public: {
    sequences: [],
    isLoading: true,
  },
  private: {
    sequences: [],
    isLoading: false,
  },
};

const sequenceSlice = createSlice({
  name: "sequence",
  initialState,
  reducers: {
    setIsPublicSequencesLoading: (state, action: PayloadAction<boolean>) => {
      state.public.isLoading = action.payload;
    },
    setPublicSequences: (state, action: PayloadAction<Sequence[]>) => {
      state.public.sequences = [...action.payload];
    },
    setIsPrivateSequencesLoading: (state, action: PayloadAction<boolean>) => {
      state.private.isLoading = action.payload;
    },
    setPrivateSequences: (state, action: PayloadAction<Sequence[]>) => {
      state.private.sequences = [...action.payload];
    },
    setCurrentSequence: (state, action: PayloadAction<Sequence>) => {
      state.current = action.payload;
    },
  },
});

export const fetchPublicSequencesThunk = (): ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  AnyAction
> => async (dispatch) => {
  dispatch(setIsPublicSequencesLoading(true));
  const sequences = await fetchPublicSequences();
  dispatch(setPublicSequences(sequences));
  dispatch(setCurrentSequence(sequences[0]));
  dispatch(setIsPublicSequencesLoading(false));

};

export const fetchPrivateSequencesThunk = (
  token: IdToken
): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => async (dispatch, getState) => {
  // dispatch(setIsPrivateSequencesLoading(true));
  const sequences = await fetchPrivateSequences(token);
  dispatch(setPrivateSequences(sequences));
  dispatch(setIsPrivateSequencesLoading(false));
};

export const createSequenceThunk = (
  sequence: CreateSequenceInput,
  idToken: IdToken
): ThunkAction<Promise<Sequence>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<Sequence> => {
    const newSequence = await createSequence(sequence, idToken);
    const existingSequences = getState().sequence.private.sequences;
    dispatch(setPrivateSequences([newSequence, ...existingSequences]));
    if (newSequence.isPublic) {
      await dispatch(fetchPublicSequencesThunk())
    }
    return newSequence;
  };

export const updateSequenceThunk = (
  sequence: UpdateSequenceInput,
  idToken: IdToken
): ThunkAction<Promise<Sequence>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<Sequence> => {
    const newSequence = await updateSequence(sequence, idToken);
    const existingSequences = getState().sequence.private.sequences;
    const i = existingSequences.findIndex((m) => m._id === sequence._id)

    if (i >= 0) {
      const privateSequences = [...existingSequences.slice(0, i), newSequence, ...existingSequences.slice(i + 1)]
      dispatch(setPrivateSequences(privateSequences));
    }
    if (newSequence.isPublic) {
      await dispatch(fetchPublicSequencesThunk())
    }
    return newSequence;
  };

export const deleteSequenceThunk = (
  sequenceId: string,
  idToken: IdToken
): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => async (
  dispatch,
  getState
): Promise<void> => {
    await deleteSequenceById(sequenceId, idToken);
    const existingPrivateSequences = getState().sequence.private.sequences;
    const existingPublicSequences = getState().sequence.public.sequences;

    const newPrivateSequences = existingPrivateSequences.filter((s) => s._id !== sequenceId)
    const newPublicSequences = existingPublicSequences.filter((s) => s._id !== sequenceId)
    dispatch(setPrivateSequences(newPrivateSequences))
    dispatch(setPublicSequences(newPublicSequences))
  };

export const {
  setIsPublicSequencesLoading,
  setIsPrivateSequencesLoading,
  setPublicSequences,
  setPrivateSequences,
  setCurrentSequence,
} = sequenceSlice.actions;

export const selectPublicSequences = (state: RootState) =>
  state.sequence.public.sequences;
export const selectPrivateSequences = (state: RootState) =>
  state.sequence.private.sequences;
export const selectCurrentSequence = (state: RootState) =>
  state.sequence.current || null;
export const selectIsPublicSequencesLoading = (state: RootState) =>
  state.sequence.public.isLoading;
export const selectIsPrivateSequencesLoading = (state: RootState) =>
  state.sequence.private.isLoading;

export default sequenceSlice.reducer;
