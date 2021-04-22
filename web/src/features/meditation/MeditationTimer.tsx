import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectCurrentMeditation,
  selectSessionLength,
} from "./meditationSlice";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { createStyles } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import PauseIcon from "@material-ui/icons/Pause";
import { Duration } from "luxon";
import { Meditation } from "./meditationService";
import bell from "../../audio/ship_bell_mono.mp3";
// import Container from "@material-ui/core/Container";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      flexGrow: 1,
      minHeight: "100vh",
    },
    timerRow: {
      display: "flex",
      justifyContent: "center",
    },
    timerItem: {
      maxWidth: 300,
    },
    timerButtons: {
      padding: 10,
      marginLeft: 10,
    },
    gridContainer: {
      alignContent: "center",
      justifyContent: "center",
      flexGrow: 1,
      minHeight: "90vh",
    },
    meditationHeader: {
      textAlign: "center",
      marginBottom: 20
    },
    meditationText: {
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: 20
    },
  })
);

export function MeditationTimer() {
  const currentMeditation: null | Meditation = useSelector(
    selectCurrentMeditation
  );
  const sessionLength = useSelector(selectSessionLength);
  const [timeRemaining, setTimeRemaining] = useState(sessionLength);

  const [bellDuration, setBellDuration] = useState(0);
  const [meditationDuration, setMeditationDuration] = useState(0);

  const audioSource =
    currentMeditation === null ? "" : currentMeditation.audioUrl;
  const meditationAudioRef = useRef(new Audio(audioSource));
  const bellAudioRef = useRef(new Audio(bell));
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [stopPressed, setStopPressed] = useState(false);

  const playBellAndMeditation = () => {
    // reset time, clear the event listeners
    bellAudioRef.current.currentTime = 0
    meditationAudioRef.current.currentTime = 0
    bellAudioRef.current.onended = () => {}
    meditationAudioRef.current.onended = () => {}

    // play the chain and cue up the bell -> meditation -> bell sequence
    bellAudioRef.current.play();
    bellAudioRef.current.onended = () => {
      meditationAudioRef.current.onended = () => {
        bellAudioRef.current.onended = () => {
          setIsAudioPlaying(false)
        };
        bellAudioRef.current.play();
      };
      meditationAudioRef.current.play();
    };
  };

  // for playing and pausing
  useEffect(() => {
    if (isAudioPlaying) {
      // set the durations
      setBellDuration(bellAudioRef.current.duration);
      setMeditationDuration(meditationAudioRef.current.duration);
      // play
      playBellAndMeditation();
    } else {
      bellAudioRef.current.pause();
      meditationAudioRef.current.pause();
    }
  }, [isAudioPlaying]);

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
    const timeout = setTimeout(() => {
      if (!isTimerRunning) {
        return;
      }

      const newTime = Duration.fromMillis(timeRemaining)
        .minus(Duration.fromMillis(1000))
        .toMillis();

      //initiate final meditation and bell
      if (!isAudioPlaying && newTime <= 1000*(bellDuration * 2 + meditationDuration)) {
        setIsAudioPlaying(true);
        // playBellAndMeditation();
      }

      if (newTime <= 0) {
        setIsAudioPlaying(false);
        setIsTimerRunning(false);
        setStopPressed(true);
      }

      setTimeRemaining(newTime);
    }, 1000);

    return () => {
      // for cleanup, and also ensuring that
      // the reset of the time "sticks"
      clearTimeout(timeout);
    };
  });

  const toggleIsPlaying = () => {
    setStopPressed(false);
    if (isAudioPlaying) {
      setIsAudioPlaying(false)
      setIsTimerRunning(false)
    } else {
      setIsAudioPlaying(true)
      setIsTimerRunning(true)
    }
  };

  const onStop = () => {
    setIsAudioPlaying(false);
    setIsTimerRunning(false);
    setStopPressed(true);
  };

  const classes = useStyles();

  if (currentMeditation === null) {
    return <div></div>;
  }
  return (
    <Container>
      <Grid container spacing={2} className={classes.gridContainer}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Grid item xs={12}>
                <Typography variant="h6" className={classes.meditationHeader}>
                  {currentMeditation.name}
                </Typography>
                <Typography paragraph={true} className={classes.meditationText}>
                  {currentMeditation.text}
                </Typography>
              </Grid>
              <Grid
                container
                spacing={2}
                style={{ border: "10px" }}
                className={classes.timerRow}
              >
                <Grid item className={classes.timerItem}>
                  <Button
                    variant="contained"
                    className={classes.timerButtons}
                    onClick={() => {
                      setTimeRemaining(sessionLength);
                      onStop();
                    }}
                  >
                    <StopIcon />
                  </Button>
                </Grid>
                <Grid item className={classes.timerItem}>
                  <Typography className={classes.timerItem} variant="h4">
                    {Duration.fromMillis(timeRemaining).toFormat("mm:ss")}
                  </Typography>
                </Grid>

                <Grid item className={classes.timerRow}>
                  <Button
                    variant="contained"
                    className={classes.timerButtons}
                    onClick={toggleIsPlaying}
                  >
                    {isAudioPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
