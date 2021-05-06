import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchPrivateMeditationsThunk,
  selectIsPrivateMeditationsLoading,
  selectPrivateMeditations,
} from "./meditationSlice";
import {
  Button,
  CircularProgress,
  Grid,
  Theme,
  Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { createStyles, makeStyles } from "@material-ui/styles";
import { IdToken, useAuth0 } from "@auth0/auth0-react";
import { MeditationList } from "./MeditationList";
import { AppDispatch } from "../../app/store";
import { selectIdToken } from "../user/userSlice";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cardActions: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-end",
      flexDirection: "row",
    },
    selectorGrid: {
      alignContent: "center",
      justifyContent: "center",
    },
    spinner: {
      height: "100vh",
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
    },
    buttonRow: {
      marginBottom: 10,
    },
    toolbar: theme.mixins.toolbar,
  })
);

export function PrivateMeditationsPage() {
  const { isAuthenticated } = useAuth0();
  const privateMeditations = useSelector(selectPrivateMeditations);
  const isPrivateMeditationsLoading = useSelector(
    selectIsPrivateMeditationsLoading
  );
  const idToken = useSelector(selectIdToken)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(fetchPrivateMeditationsThunk(idToken as IdToken));
  }, [isAuthenticated]);

  const classes = useStyles();

  if (!isAuthenticated) {
    return (
      <React.Fragment>
        <div className={classes.toolbar} />
        <Typography>Please login to view your personal meditations.</Typography>
      </React.Fragment>
    );
  }

  if (isPrivateMeditationsLoading) {
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
		  <Grid item  xs={12} className={classes.buttonRow}>
			  <Grid container direction="row-reverse">
			  <Button variant="outlined" size="large">Add<AddIcon/></Button>
			  </Grid>
		  </Grid>
        <Grid item xs={12}>
          <MeditationList
            meditations={privateMeditations}
            isLoading={isPrivateMeditationsLoading}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
