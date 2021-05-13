import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  CircularProgress,
  Grid,
  Theme,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  CardHeader,
  Card,
  CardContent,
  Typography,
  CardMedia,
  CardActions,
  Tooltip,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";
import { useHistory } from "react-router-dom";

import { selectIdToken } from "../../user/userSlice";
import { IdToken } from "@auth0/auth0-react";
import { AppDispatch } from "../../../app/store";
import { Meditation } from "../../meditation/meditationService";
import { Sequence } from "../sequenceService";
import { setCurrentSequence } from "../sequenceSlice";
import {Link as RouterLink} from "react-router-dom";
// import { MeditationCard } from "./MeditationCard";

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
    },
    title: {
      flexGrow: 1,
    },
    toolbar: theme.mixins.toolbar,
    // card stuff
    cardRoot: {
      maxWidth: 360,
    },
    cardMedia: {
      height: 0,
      paddingTop: '56.25%'
      // paddingTop: '50%'
    },
  })
);

export interface SequenceListProps {
  sequences: Sequence[];
  isLoading: boolean;
}

export function SequenceList({
  sequences,
  isLoading,
}: SequenceListProps) {
  const idToken = useSelector(selectIdToken);

  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(
    {} as Meditation
  );

  const chooseSequence = (sequence: Sequence) => {
    dispatch(setCurrentSequence(sequence));
  };

//   const handleDeleteDialogClose = (shouldDelete: boolean) => {
//     if (shouldDelete) {
//       dispatch(
//         deleteMeditationThunk(selectedMeditation._id, idToken as IdToken)
//       );
//     }
//     setIsDeleteDialogOpen(false);
//   };

  const classes = useStyles();

  if (isLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }


  const sequenceCards = sequences.map((s) => (
    <Grid item xs={6} md={6} key={s._id}>
      <Card className={classes.cardRoot}>
		  <CardMedia image={s.imageUrl} className={classes.cardMedia} />

      <CardActions>
        <Grid container justify="space-between">
        <Tooltip title={<Typography>{s.description}</Typography>}>
        <Button component={RouterLink} to={`${s._userId === idToken?.sid ? "" : "/private" }/sequences/${s._id}`} style={{flexGrow: 1}}>{s.name}</Button>
        </Tooltip>
        </Grid>
      </CardActions>
	  </Card>
    </Grid>
  ));

  return (
    <React.Fragment>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {sequenceCards}
      </Grid>
      {/* <Dialog open={isDeleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this meditation? This action <b>can not</b> be undone.
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
      </Dialog> */}
    </React.Fragment>
  );
}
