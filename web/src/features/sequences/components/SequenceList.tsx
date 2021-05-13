import React from "react";
import { useSelector } from "react-redux";
import {
  Button,
  CircularProgress,
  Grid,
  Theme,
  Card,
  Typography,
  CardMedia,
  CardActions,
  Tooltip,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";

import { selectIdToken } from "../../user/userSlice";
import { Sequence } from "../sequenceService";
import { Link as RouterLink } from "react-router-dom";

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
      background: "inherit",
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
      paddingTop: "56.25%",
    },
  })
);

export interface SequenceListProps {
  sequences: Sequence[];
  isLoading: boolean;
}

export function SequenceList({ sequences, isLoading }: SequenceListProps) {
  const idToken = useSelector(selectIdToken);
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
              <Button
                component={RouterLink}
                to={`${
                  s._userId === idToken?.sid ? "" : "/private"
                }/sequences/${s._id}`}
                style={{ flexGrow: 1 }}
              >
                {s.name}
              </Button>
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
    </React.Fragment>
  );
}
