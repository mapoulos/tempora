import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPublicMeditationsThunk,
  selectIsPublicMeditationsLoading,
  selectPublicMeditations,
} from "../meditationSlice";
import {
  CircularProgress,
  Grid,
  Theme,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";
import { MeditationList } from "./MeditationList";
import { AppDispatch } from "../../../app/store";

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

export function PublicMeditationsPage() {
  const publicMeditations = useSelector(selectPublicMeditations);
  const isPublicMeditationsLoading = useSelector(
    selectIsPublicMeditationsLoading
  );

  const dispatch = useDispatch<AppDispatch>()

  const classes = useStyles();

  useEffect(() => {
    dispatch(fetchPublicMeditationsThunk())
  },[])

  if (isPublicMeditationsLoading) {
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
          <MeditationList
            meditations={publicMeditations}
            isLoading={isPublicMeditationsLoading}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
