import {
  makeStyles,
  Theme,
  createStyles,
  CircularProgress,
  Grid,
} from "@material-ui/core";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../app/store";
import {
  fetchPublicSequencesThunk,
  selectIsPublicSequencesLoading,
  selectPublicSequences,
} from "../sequenceSlice";
import { SequenceList } from "./SequenceList";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    spinner: {
      height: "100vh",
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
    },
    toolbar: theme.mixins.toolbar,
  })
);

export const PublicSequenceListPage = () => {
  const publicSequences = useSelector(selectPublicSequences);
  const isSequencesLoading = useSelector(selectIsPublicSequencesLoading);
  const dispatch = useDispatch<AppDispatch>();
  const classes = useStyles();

  useEffect(() => {
    dispatch(fetchPublicSequencesThunk());
  }, []);

  if (isSequencesLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Grid container>
        <Grid item xs={12}>
          <SequenceList
            sequences={publicSequences}
            isLoading={isSequencesLoading}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};
