import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import {
  selectCurrentMeditation,
  selectPublicMeditations,
  selectSessionLength,
  setCurrentMeditation,
  updateSessionLength,
} from "./meditationSlice";
import { Button, Card, CardContent, Grid, Typography } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { createStyles } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import PauseIcon from "@material-ui/icons/Pause";
import { Duration } from "luxon";
import { Meditation } from "./meditationService";
import store from "../../app/store";
import bell from "../../audio/ship_bell_mono.mp3";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
      height: "100vh",
    },
    meditationHeader: {
      textAlign: "center",
      marginBottom: 20,
    },
    meditationText: {
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: 20,
    },
    newlineMeditationDiv: {
      textAlign: "left",
    },
    newlineMeditationParagraph: {
      padding: 0,
      margin: 0,
      marginLeft: "5%",
    },
  })
);

export function MeditationTimer() {
  const currentMeditation: null | Meditation = useSelector(
    selectCurrentMeditation
  );
  const meditations = useSelector(selectPublicMeditations);
  const meditationToIndexMap = meditations.reduce((accumulator, m, i) => {
    accumulator[m._id] = i;
    return accumulator;
  }, {} as Record<string, number>);

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

  const playOrResumeBellAndMeditation = () => {
    //check for resume
    if (bellAudioRef.current.currentTime > 0) {
      bellAudioRef.current.play()
      return
    }
    if (meditationAudioRef.current.currentTime > 0) {
      meditationAudioRef.current.play()
      return
    }

    // reset time, clear the event listeners
    bellAudioRef.current.currentTime = 0;
    meditationAudioRef.current.currentTime = 0;
    bellAudioRef.current.onended = () => {};
    meditationAudioRef.current.onended = () => {};

    // play the chain and cue up the bell -> meditation -> bell sequence
    bellAudioRef.current.play();
    bellAudioRef.current.onended = () => {
      // reset the bell time
      bellAudioRef.current.currentTime = 0;
      // queue up the meditation to play after
      meditationAudioRef.current.onended = () => {
        // reset the meditation time
        meditationAudioRef.current.currentTime = 0
        // queue up the final bell to flip isAudioPlaying
        bellAudioRef.current.onended = () => {
          bellAudioRef.current.currentTime = 0;
          setIsAudioPlaying(false);
        };
        // play the bell
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
      playOrResumeBellAndMeditation();
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
    bellAudioRef.current.pause();
    meditationAudioRef.current.pause();
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
      if (
        !isAudioPlaying &&
        newTime <= 1000 * (bellDuration * 2 + meditationDuration)
      ) {
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

  const updateSessionLengthAndTimeRemaining = (duration: number) => {
    if (
      duration < Duration.fromObject({ minutes: 5 }).toMillis() ||
      duration > Duration.fromObject({ hour: 1 }).toMillis()
    ) {
      return;
    }
    store.dispatch(updateSessionLength(duration));
    setTimeRemaining(duration);
  };

  const addFiveMinutesToSession = () => {
    const newDuration = Duration.fromMillis(sessionLength)
      .plus(Duration.fromObject({ minutes: 5 }))
      .toMillis();
    updateSessionLengthAndTimeRemaining(newDuration);
  };

  const subtractFiveMinutesToSession = () => {
    const newDuration = Duration.fromMillis(sessionLength)
      .minus(Duration.fromObject({ minutes: 5 }))
      .toMillis();
    updateSessionLengthAndTimeRemaining(newDuration);
  };

  const shiftMeditationRight = () => {
    if (currentMeditation === null) {
      return;
    }
    const currentMeditationIndex = meditationToIndexMap[currentMeditation._id];
    const nextMeditationIndex =
      currentMeditationIndex < meditations.length - 1
        ? currentMeditationIndex + 1
        : 0;
    const nextMeditation = meditations[nextMeditationIndex];
    store.dispatch(setCurrentMeditation(nextMeditation));
  };

  const shiftMeditationLeft = () => {
    if (currentMeditation === null) {
      return;
    }
    const currentMeditationIndex = meditationToIndexMap[currentMeditation._id];
    const nextMeditationIndex =
      currentMeditationIndex > 0
        ? currentMeditationIndex - 1
        : meditations.length - 1;
    const nextMeditation = meditations[nextMeditationIndex];
    store.dispatch(setCurrentMeditation(nextMeditation));
  };

  // key listeners
  useEffect(() => {
    const keyUpListener = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          if (isTimerRunning) {
            break;
          }
          addFiveMinutesToSession();
          break;
        case "ArrowDown":
          if (isTimerRunning) {
            break;
          }
          subtractFiveMinutesToSession();
          break;
        case "ArrowRight":
          if (isTimerRunning) {
            break;
          }
          shiftMeditationRight();
          break;
        case "ArrowLeft":
          if (isTimerRunning) {
            break;
          }
          shiftMeditationLeft();
          break;
      }
    };
    window.addEventListener("keyup", keyUpListener);

    return () => window.removeEventListener("keyup", keyUpListener);
  }, [sessionLength, currentMeditation, isTimerRunning]);

  // swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      shiftMeditationRight();
    },
    onSwipedRight: () => {
      shiftMeditationLeft();
    },
    onSwipedUp: () => {
      addFiveMinutesToSession();
    },
    onSwipedDown: () => {
      subtractFiveMinutesToSession();
    },
    preventDefaultTouchmoveEvent: true,
  });

  const toggleIsPlaying = () => {
    setStopPressed(false);
    if (isAudioPlaying) {
      setIsAudioPlaying(false);
      setIsTimerRunning(false);
    } else {
      setIsAudioPlaying(true);
      setIsTimerRunning(true);
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
    <Grid container spacing={2} {...handlers} className={classes.gridContainer}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Grid item xs={12}>
              <Typography variant="h6" className={classes.meditationHeader}>
                {currentMeditation.name}
              </Typography>
              <Typography
                paragraph={true}
                className={classes.meditationText}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {currentMeditation.text.includes("\n") ? (
                  <div className={classes.newlineMeditationDiv}>
                    {currentMeditation.text.split("\n").map((text, i) => (
                      <p key={i} className={classes.newlineMeditationParagraph}>
                        {text}
                      </p>
                    ))}
                  </div>
                ) : (
                  currentMeditation.text
                )}
              </Typography>
            </Grid>
            <Grid container spacing={2} className={classes.timerRow}>
              <Grid item className={classes.timerItem}>
                <Button
                  variant="outlined"
                  aria-label="stop"
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
                  variant="outlined"
                  disabled={timeRemaining <= 0}
                  className={classes.timerButtons}
                  aria-label="Play/Pause"
                  onClick={toggleIsPlaying}
                >
                  {isTimerRunning ? <PauseIcon /> : <PlayArrowIcon />}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
