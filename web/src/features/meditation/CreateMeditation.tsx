import {
  makeStyles,
  Theme,
  createStyles,
  Typography,
  CardHeader,
  CardContent,
  Card,
  TextField,
  Grid,
  Button,
  Paper,
  CardActions,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectIdToken } from "../user/userSlice";
import { uploadMp3 } from "./meditationService";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formRoot: {
      margin: theme.spacing(1),
      // width: "25ch",
      // flexGrow: 1,
      display: "flex",
    },
    gridContainer: {
      display: "flex",
    },
    gridItem: {
      flexGrow: 1,
      spacing: theme.spacing(1)
    },
    nameField: {
      flexGrow: 1,
      // minWidth: 400,
      // width: "80%",
      justifyContent: "center",
      paddingBottom: theme.spacing(2),
    },
    meditationTextField: {
      flexGrow: 1,
      // minWidth: 400,
      // width: "80%",
      paddingBottom: theme.spacing(2),
    },
    toolbar: theme.mixins.toolbar,
    fileSelectRow: {
      // flexGrow: 1,
      // width: 400,
      // justifyContent: "flex-end",
      paddingBottom: theme.spacing(2),
    },
    selectFileTextField: {
      // flexGrow: 1,
      paddingBottom: theme.spacing(2),
      // overflow: "hidden",
    },
    submitButtonRow: {
      justifyContent: "flex-end",
    },
    selectFileButton: {
      paddingTop: theme.spacing(1),
    },
    cardFooter: {
      justifyContent: "flex-end",
      padding: theme.spacing(2),
    },
  })
);

export const CreateMeditation = () => {
  const idToken = useSelector(selectIdToken)
  const [state, setState] = useState({
	  audioFile: {} as File,
    meditation: {
      name: "",
      text: "",
      isPublic: false,
      uploadKey: ""
    }
  })
  const classes = useStyles();

  const handleNameFieldChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      meditation: {
        ...state.meditation,
        name: evt.target.textContent || ""
      }
    })
  }
  const handleTextFieldChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      meditation: {
        ...state.meditation,
        text: evt.target.textContent || ""
      }
    })
  }



  const handleFileSelection = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = evt.target?.files ?? []
    const file = files[0]

    if (idToken) {
      const key = await uploadMp3(file, idToken)
      setState({
		  ...state,
		  audioFile: file,
		  meditation:{
			  ...state.meditation,
			  uploadKey: key
		  }
	  })
    }
  };

  const handleIsPublicSelection = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      meditation: {
        ...state.meditation,
        isPublic: evt.target.checked
      }
    })
  };

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Card>
        <CardHeader title="Create Meditation" />
        <CardContent>
          <form className={classes.formRoot} autoComplete="off">
            <Grid container className={classes.gridContainer}>
              <Grid item className={classes.gridItem} xs={12}>
                <TextField
                  required
                  fullWidth
                  id="meditationNameField"
                  color="secondary"
                  variant="outlined"
                  label="Meditation Name"
                  className={classes.nameField}
                  onChange={handleNameFieldChange}
                ></TextField>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <TextField
                  required
                  fullWidth
                  id="meditationTextField"
                  variant="outlined"
                  color="secondary"
                  label="Meditation Text"
                  onChange={handleTextFieldChange}
                  className={classes.meditationTextField}
                  multiline
                  rows={15}
                ></TextField>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <FormControlLabel control={
                  <Checkbox checked={state.meditation.isPublic} onChange={handleIsPublicSelection} />
                } label="Make Public?"  labelPlacement="start"/>
              </Grid>
              <Grid container direction="row" justify="flex-end">
                <Grid item className={classes.fileSelectRow} xs={2}>
                  <Button
                    style={{ height: "100%" }}
                    size="large"
                    component="label"
                    variant="outlined"
                    fullWidth
                  >
                    Choose MP3
                    <input
                      type="file"
                      hidden
                      accept=".mp3"
                      onChange={handleFileSelection}
                    ></input>
                  </Button>
                </Grid>
                <Grid item className={classes.fileSelectRow} xs={10}>
                  <TextField
                    variant="outlined"
                    label={state.audioFile?.name ?? "" }
                    InputProps={{ readOnly: true }}
                    fullWidth={true}
                  />
                </Grid>
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions className={classes.cardFooter}>
          <Button size="large" variant="outlined" style={{ height: 50 }}>
            Submit
          </Button>
        </CardActions>
      </Card>
    </React.Fragment>
  );
};
