import { IdToken } from "@auth0/auth0-spa-js";
import {
  Grid,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Typography,
  createStyles,
  makeStyles,
  Theme,
  Button,
  ButtonBase,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { AppDispatch } from "../../../app/store";
import { Meditation } from "../../meditation/meditationService";
import { setCurrentMeditation } from "../../meditation/meditationSlice";
import { selectIdToken } from "../../user/userSlice";
import { fetchPrivateSequenceById, fetchPublicSequenceById, Sequence } from "../sequenceService";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    spinner: {
      height: "100vh",
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
    },
    toolbar: theme.mixins.toolbar,
    cardRoot: {
      maxWidth: 360,
    },
    cardMedia: {
      height: 0,
      paddingTop: "56.25%",
      // paddingTop: '50%'
    },
  })
);

interface SequencePageProps  {
	isPublic: boolean
}

export const SequencePage = ({isPublic}: SequencePageProps) => {
  const [sequence, setSequence] = useState<null | Sequence>(null);
  const [isSequenceLoading, setIsSequenceLoading] = useState(true);
  const { sequenceId } = useParams<{ sequenceId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory()
  const idToken = useSelector(selectIdToken)

  useEffect(() => {
	if(isPublic) {
		fetchPublicSequenceById(sequenceId).then((s) => {
			setSequence(s);
			setIsSequenceLoading(false);
		  });
	} else {
		fetchPrivateSequenceById(sequenceId, idToken as IdToken).then((s) => {
			setSequence(s);
			setIsSequenceLoading(false);
		  });
	}

  }, []);
  const classes = useStyles();
  const onMeditationSelect = (m: Meditation) => {
	  dispatch(setCurrentMeditation(m))
	  history.push("/")
  };

  if (isSequenceLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }

  const meditationListItems = (sequence?.meditations ?? []).map((m) => (
    <Grid container style={{ paddingTop: 10, paddingBottom: 10 }}>
      <Grid item xs={12}>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={9}>
            <ButtonBase onClick={() => {onMeditationSelect(m)}}>
              <Typography variant="subtitle2">{m.name}</Typography>
            </ButtonBase>
            <Typography style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"}}>
              {m.text}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Grid container justify="flex-end">
              <Button onClick={() => {onMeditationSelect(m)}}>Select</Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  ));

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Grid container>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={sequence?.name} />
            <CardContent>
              <Grid container>
                <Grid item xs={12}>
                  <Typography>{sequence?.description}</Typography>
                  <hr />
                </Grid>
                {meditationListItems}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};
