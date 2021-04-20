import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentMeditation,
  selectPublicMeditations,
} from "./meditationSlice";
import {
	Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
} from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { createStyles } from "@material-ui/core/styles";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { Duration } from "luxon";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      maxWidth: 800,
    },
  })
);

export function MeditationTimer() {
  const currentMeditation = useSelector(selectCurrentMeditation);

  const classes = useStyles();

  const duration = Duration.fromObject({minutes: 20})

  if (currentMeditation === null) {
    return <div></div>;
  }

  return (

        <Card>
          {/* <CardHeader title={currentMeditation.name} /> */}
          <CardContent>
		  <Grid container spacing={5}>
      		<Grid item xs={12}>
              <Typography variant="h6">{currentMeditation.name}</Typography>
              <p>{currentMeditation.text}</p>
              <p>
                <audio>
                  <source
                    src={currentMeditation.audioUrl}
                    type="audio/mpeg"
                  ></source>
                </audio>
              </p>
            </Grid>
			<Grid item xs={6}>
				<Typography  display="block">{duration.toFormat("mm:ss")}</Typography>

			</Grid>
			<Grid item xs={6} spacing={6}><Button variant="contained"><PlayArrowIcon/></Button></Grid>
			</Grid>
          </CardContent>
          <CardActions></CardActions>
        </Card>

  );
}
