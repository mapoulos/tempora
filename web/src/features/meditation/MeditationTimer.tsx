import React, { useState, useRef, useEffect } from "react";
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
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import PauseIcon from "@material-ui/icons/Pause";
import { Duration } from "luxon";
import { Meditation } from "./meditationService";
import bell from "../../audio/ship_bell_mono.mp3";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      maxWidth: 800,
    },
    timer: {
      flexGrow: 1,
      display: "flex",
      justifyContent: "center",
      marginBottom: 0,
    },
    timerButtons: {
      padding: 10,
      marginLeft: 10,
      marginTop: 0,
    },
  })
);

export function MeditationTimer() {
  const currentMeditation: null | Meditation = useSelector(
    selectCurrentMeditation
  );
  const audioSource =
    currentMeditation === null ? "" : currentMeditation.audioUrl;
  const meditationAudioRef = useRef(new Audio(audioSource));
  const bellAudioRef = useRef(new Audio(bell));
  const [isPlaying, setIsPlaying] = useState(false);
  const [stopPressed, setStopPressed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    Duration.fromObject({ minutes: 20 }).toMillis()
  );

  // for playing and pausing
  useEffect(() => {
    if (isPlaying) {
      bellAudioRef.current.play();
      bellAudioRef.current.onended = () => {
        meditationAudioRef.current.onended = () => {
          bellAudioRef.current.onended = () => {};
          bellAudioRef.current.play();
        };
        meditationAudioRef.current.play();
      };
    } else {
      bellAudioRef.current.pause();
      meditationAudioRef.current.pause();
    }
  }, [isPlaying]);

  // for handling when stop is pressed
  useEffect(() => {
    if (!stopPressed) {
      return;
    }
    bellAudioRef.current.currentTime = 0;
    meditationAudioRef.current.currentTime = 0;
  }, [stopPressed]);

  // for handling when a new meditation is selected
  useEffect(() => {
    meditationAudioRef.current.pause();
    meditationAudioRef.current = new Audio(audioSource);
  }, [audioSource]);

  // for counting down
  useEffect(() => {
    setTimeout(() => {
      if (!isPlaying) {
        return;
      }

      const newTime = Duration.fromMillis(timeRemaining)
        .minus(Duration.fromMillis(1000))
        .toMillis();

      setTimeRemaining(newTime);
    }, 1000);
  });

  const toggleIsPlaying = () => {
    setStopPressed(false);
    isPlaying ? setIsPlaying(false) : setIsPlaying(true);
  };

  const onStop = () => {
    setIsPlaying(false);
    setStopPressed(true);
  };

  const classes = useStyles();

  if (currentMeditation === null) {
    return <div></div>;
  }
  return (
    <Card>
      {/* <CardHeader title={currentMeditation.name} /> */}
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{currentMeditation.name}</Typography>
            <p>{currentMeditation.text}</p>
          </Grid>

          <Grid item xs={12} className={classes.timer}>
            <Typography className={classes.timer} variant="h3">
              {Duration.fromMillis(timeRemaining).toFormat("mm:ss")}
            </Typography>
          </Grid>
          <Grid item xs={12} className={classes.timer}>
            <Button
              variant="contained"
              className={classes.timerButtons}
              onClick={toggleIsPlaying}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </Button>
            <Button
              variant="contained"
              className={classes.timerButtons}
              onClick={() => {
				setTimeRemaining(Duration.fromObject({ minutes: 20 }).toMillis());
				  onStop()
				}
			}
            >
              <StopIcon />
            </Button>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions></CardActions>
    </Card>
  );
}
