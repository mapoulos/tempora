import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  deleteMeditationThunk,
  fetchPrivateMeditationsThunk,
  setCurrentMeditation,
} from "./meditationSlice";
import {
  Button,
  CircularProgress,
  Grid,
  Theme,
  Typography,
  AppBar,
  Toolbar,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { createStyles, makeStyles } from "@material-ui/styles";
import { Link as RouterLink, useHistory } from "react-router-dom";
import { Meditation } from "./meditationService";
import { selectIdToken } from "../user/userSlice";
import { IdToken, useAuth0 } from "@auth0/auth0-react";
import { AppDispatch } from "../../app/store";
import { MeditationCard } from "./MeditationCard";

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
    indicator: {
      background: "white",
      color: "white",
    },
    header: {
      marginBottom: 3,
      padding: 10,
      textAlign: "center",
    },
    appBar: {
		background: "inherit"
    //   background: theme.palette.grey[600],
    },
    title: {
      flexGrow: 1,
    },
    toolbar: theme.mixins.toolbar,
  })
);

export interface MeditationListProps {
  meditations: Meditation[];
  isLoading: boolean;
}

export function MeditationList({
  meditations,
  isLoading,
}: MeditationListProps) {
  const idToken = useSelector(selectIdToken);

  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(
    {} as Meditation
  );

  const chooseMeditation = (meditation: Meditation) => {
    dispatch(setCurrentMeditation(meditation));
  };

  const handleDeleteDialogClose = (shouldDelete: boolean) => {
    if (shouldDelete) {
      dispatch(
        deleteMeditationThunk(selectedMeditation._id, idToken as IdToken)
      );
    }
    setIsDeleteDialogOpen(false);
  };

  const classes = useStyles();

  if (isLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }


  const meditationCards = meditations.map((m) => (
    <Grid item xs={12} key={m._id}>
      <MeditationCard
        meditation={m}
        canEdit={m._userId === idToken?.sub}
        key={m._id}
        onSelect={() => {
          chooseMeditation(m);
          history.push("/");
        }}
        onEdit={() => {
          history.push(`/meditations/${m._id}/update`);
        }}
        onDelete={() => {
          setSelectedMeditation(m);
          setIsDeleteDialogOpen(true);
        }}
      />
    </Grid>
  ));

  return (
    <React.Fragment>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
      <Dialog open={isDeleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this meditation? This action
            <b>can not</b> be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDeleteDialogClose(false)}
            autoFocus
            variant="contained"
          >
            No
          </Button>
          <Button
            onClick={() => handleDeleteDialogClose(true)}
            color="secondary"
            variant="contained"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
