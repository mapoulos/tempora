import classes from "*.module.css";
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
} from "@material-ui/core";
import React, { useState } from "react";

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
    },
    nameField: {
      flexGrow: 1,
      minWidth: 400,
      paddingBottom: theme.spacing(2),
    },
    meditationTextField: {
      flexGrow: 1,
      minWidth: 400,
      paddingBottom: theme.spacing(2),
    },
    toolbar: theme.mixins.toolbar,
    fileSelectRow: {
      // flexGrow: 1,
      width: 400,
      justifyContent: "space-between",
    },
	selectFileTextField: {
		flexGrow: 1,
		width: "100%",
		paddingBottom: theme.spacing(2),
		overflow: "hidden"
	},
	submitButtonRow: {
		justifyContent: "flex-end",
		width: 400
	},
    selectFileButton: {
      paddingTop: theme.spacing(1),
    },
  })
);

export const CreateMeditation = () => {
  const [audioFile, setAudioFile] = useState("");
  const classes = useStyles();

  const handleFileSelection = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = (evt.target?.files ?? [])[0] || "";
    setAudioFile(file.name);
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
				  id="meditationNameField"
                  color="secondary"
				  variant="outlined"
                  label="Meditation Name"
                  className={classes.nameField}
                ></TextField>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <TextField
                  required
				  id="meditationTextField"
				  variant="outlined"
                  color="secondary"
                  label="Meditation Text"
                  className={classes.meditationTextField}
                  multiline
                  rows={15}
                ></TextField>
              </Grid>
              <Grid container className={classes.fileSelectRow}>
                <Grid item className={classes.gridItem} xs={9}>
                  <TextField label={audioFile}  InputProps={{ readOnly: true }} id="meditationFileName" className={classes.selectFileTextField}>
                    {audioFile}
                  </TextField>
                </Grid>
                <Grid item xs={3} className={classes.selectFileButton}>
                  <Button size="large" component="label" variant="outlined">
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={handleFileSelection}
                    ></input>
                  </Button>
                </Grid>
              </Grid>
			  <Grid item className={classes.fileSelectRow} xs={12}><Grid container className={classes.submitButtonRow}> <Button size="large" variant="outlined">Submit</Button></Grid></Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </React.Fragment>
  );
};
