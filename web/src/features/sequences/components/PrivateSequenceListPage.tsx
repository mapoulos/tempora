import { IdToken, useAuth0 } from "@auth0/auth0-react";
import { makeStyles, Theme, createStyles, Grid, Button } from "@material-ui/core";
import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AddIcon from "@material-ui/icons/Add";
import { AppDispatch } from "../../../app/store";
import { selectIdToken } from "../../user/userSlice";
import {
  fetchPrivateSequencesThunk,
  selectIsPrivateSequencesLoading,
  selectPrivateSequences,
} from "../sequenceSlice";
import { SequenceList } from "./SequenceList";

// - get a sequence page wired in.
// - show the public sequences
// - show the private sequences
// - a create form

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    spinner: {
      height: "100vh",
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
    },
    toolbar: theme.mixins.toolbar,
    buttonRow: {
      marginBottom: 10,
    },
  })
);

export const PrivateSequenceListPage = () => {
  const privateSequences = useSelector(selectPrivateSequences);
  const isSequencesLoading = useSelector(selectIsPrivateSequencesLoading);
  const dispatch = useDispatch<AppDispatch>();
  const classes = useStyles();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const idToken = useSelector(selectIdToken);

  useEffect(() => {
    dispatch(fetchPrivateSequencesThunk(idToken as IdToken));
  }, []);

  if (!isAuthenticated) {
    loginWithRedirect();
  }

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Grid container>
        <Grid item xs={12} className={classes.buttonRow}>
          <Grid container direction="row-reverse">
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/private/sequences/create"
            >
              Add
              <AddIcon />
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <SequenceList
            sequences={privateSequences}
            isLoading={isSequencesLoading}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};
