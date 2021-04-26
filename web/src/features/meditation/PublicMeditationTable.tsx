import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsPublicMeditationsLoading,
  selectPublicMeditations,
  setCurrentMeditation,
} from "./meditationSlice";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Theme,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";
import { Link as RouterLink } from "react-router-dom";
import { Meditation } from "./meditationService";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cardActions: {
      flex: 1,
      width: "100%",
      flexDirection: "row-reverse",
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
    toolbar: theme.mixins.toolbar,
  })
);

export function PublicMeditationTable() {
  const isLoading = useSelector(selectIsPublicMeditationsLoading);
  const publicMeditations = useSelector(selectPublicMeditations);
  const dispatch = useDispatch();
  const classes = useStyles();

  const chooseMeditation = (meditation: Meditation) => {
    dispatch(setCurrentMeditation(meditation));
  };

  if (isLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }

  const meditationCards = publicMeditations.map((m) => (
    <Grid item xs={12} md={12} key={m._id}>
      <Card>
        <CardHeader title={m.name} />
        <CardContent>{m.text}</CardContent>
        <CardActions className={classes.cardActions}>
          <Button
            onClick={() => chooseMeditation(m)}
            component={RouterLink}
            to="/"
          >
            Select
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  return (
    // <Paper square>
    <React.Fragment>
      <div className={classes.toolbar} />

      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
    </React.Fragment>
  );
}
