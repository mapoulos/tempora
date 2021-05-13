import { IdToken } from "@auth0/auth0-spa-js";
import {
  makeStyles,
  Theme,
  createStyles,
  CardHeader,
  CardContent,
  Card,
  TextField,
  Grid,
  Button,
  CardActions,
  FormControlLabel,
  Checkbox,
  Typography,
  Tooltip,
  ListItem,
  List,
  Divider,
} from "@material-ui/core";
import { Cancel } from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router";
import { AppDispatch } from "../../../app/store";
import {
  fetchPrivateMeditationsThunk,
  selectPrivateMeditations,
} from "../../meditation/meditationSlice";
import { selectIdToken } from "../../user/userSlice";
import { CreateSequenceInput, uploadImage } from "../sequenceService";
import {
  createSequenceThunk,
  selectPrivateSequences,
  updateSequenceThunk,
} from "../sequenceSlice";
import { SelectableMeditationCard } from "../../meditation/components/SelectableMeditationCard";
import { Meditation } from "../../meditation/meditationService";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formRoot: {
      margin: theme.spacing(1),
      display: "flex",
    },
    gridContainer: {
      display: "flex",
    },
    gridItem: {
      flexGrow: 1,
      spacing: theme.spacing(1),
    },
    nameField: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: theme.spacing(2),
    },
    sequenceDescriptionField: {
      flexGrow: 1,
      paddingBottom: theme.spacing(2),
    },
    toolbar: theme.mixins.toolbar,
    fileSelectRow: {
      paddingBottom: theme.spacing(2),
      paddingTop: theme.spacing(2),
    },
    selectFileTextField: {
      paddingBottom: theme.spacing(2),
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
    buttonRow: {
      marginBottom: 10,
    },
  })
);

export interface CreateOrUpdateSequenceProps {
  sequenceId?: string;
}

export const CreateOrUpdateSequence = () => {
  const dispatch = useDispatch<AppDispatch>();
  const idToken = useSelector(selectIdToken);
  const privateSequences = useSelector(selectPrivateSequences);
  const privateMeditations = useSelector(selectPrivateMeditations);

  const history = useHistory();
  const [showMedidtationSelector, setShowMeditationSelector] = useState(false);
  const [state, setState] = useState({
    audioFile: {} as File,
    sequence: {
      name: "",
      description: "",
      isPublic: false,
      uploadKey: "",
      meditationIds: [] as string[],
    },
  });

  const { sequenceId } = useParams<CreateOrUpdateSequenceProps>();

  const sequence =
    sequenceId !== undefined
      ? privateSequences.find((m) => m._id === sequenceId)
      : undefined;

  const isUpdate = sequence !== undefined;

  const [selectedMeditations, setInprogressSelectedMeditations] = useState(
    (sequence?.meditations ?? []).reduce(
      (
        acc: Record<string, Meditation>,
        m: Meditation
      ): Record<string, Meditation> => {
        acc[m._id] = m;
        return acc;
      },
      {}
    )
  );

  useEffect(() => {
    dispatch(fetchPrivateMeditationsThunk(idToken as IdToken));
    if (isUpdate) {
      setState({
        ...state,
        sequence: {
          ...state.sequence,
          name: sequence?.name ?? "",
          description: sequence?.description ?? "",
          isPublic: sequence?.isPublic ?? false,
        },
      });
    }
  }, [idToken]);

  const isTextFieldValid = (val: string) => {
    const trimmed = val.trim();
    return trimmed.length > 0 && trimmed.length < 2000;
  };

  const isSubmitEnabled =
    isTextFieldValid(state.sequence.name) &&
    isTextFieldValid(state.sequence.description) &&
    (isTextFieldValid(state.sequence.uploadKey) || isUpdate);
  const classes = useStyles();

  const handleNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      sequence: {
        ...state.sequence,
        name: evt.target.value || "",
      },
    });
  };
  const handleDescriptionChange = (
    evt: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState({
      ...state,
      sequence: {
        ...state.sequence,
        description: evt.target.value || "",
      },
    });
  };

  const handleFileSelection = async (
    evt: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = evt.target?.files ?? [];
    const file = files[0];

    if (idToken) {
      const key = await uploadImage(file, idToken);
      setState({
        ...state,
        audioFile: file,
        sequence: {
          ...state.sequence,
          uploadKey: key,
        },
      });
    }
  };

  const handleIsPublicSelection = (
    evt: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState({
      ...state,
      sequence: {
        ...state.sequence,
        isPublic: evt.target.checked,
      },
    });
  };

  const handleSubmit = async () => {
    const createOrUpdateSequenceArgs: CreateSequenceInput = {
      ...state.sequence,
      meditationIds: Object.values(selectedMeditations).map((m) => m._id),
    };
    try {
      if (isUpdate) {
        await dispatch(
          updateSequenceThunk(
            {
              ...createOrUpdateSequenceArgs,
              _id: sequenceId || "SEQUENCE_ID_NOT_FOUND",
            },
            idToken as IdToken
          )
        );
        history.push(`/private/sequences/${sequenceId}`);
      } else {
        const newSequence = await dispatch(
          createSequenceThunk(createOrUpdateSequenceArgs, idToken as IdToken)
        );
        history.push(`/private/sequences/${newSequence._id}`);
      }
    } catch (error) {
      console.error("There was a problem creating or updating the sequence");
      console.error(error);
    }
  };

  const resetChooseMedia = () => {
    setState({
      audioFile: {} as File,
      sequence: {
        ...state.sequence,
        uploadKey: "",
      },
    });
  };

  /////////
  // Not exactly ideal to shove this into this component, but having the meditation selector
  // as part of the form vastly simplifies the state management because then we can avoid
  // putting it in redux. A modal would also work, but a separate page (from the user's
  // point of view) is better.
  if (showMedidtationSelector) {
    return (
      <React.Fragment>
        <div className={classes.toolbar} />
        <Grid container alignContent="center" justify="center" spacing={1}>
          <Grid item xs={12} className={classes.buttonRow}>
            <Grid container direction="row-reverse">
              <Button
                variant="contained"
                color="primary"
                size="large"
                style={{ margin: 10 }}
                onClick={() => {
                  setState({
                    ...state,
                    sequence: {
                      ...state.sequence,
                      meditationIds: Object.values(selectedMeditations).map(
                        (m) => m._id
                      ),
                    },
                  });
                  setShowMeditationSelector(false);
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="large"
                style={{ margin: 10 }}
                onClick={() => {
                  setShowMeditationSelector(false);
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
          {privateMeditations.map((m) => (
            <SelectableMeditationCard
              meditation={m}
              key={m._id}
              onSelect={(meditation) => {
                if (selectedMeditations[meditation._id] === undefined) {
                  setInprogressSelectedMeditations({
                    ...selectedMeditations,
                    [meditation._id]: meditation,
                  });
                } else {
                  delete selectedMeditations[meditation._id];
                  setInprogressSelectedMeditations({
                    ...selectedMeditations,
                  });
                }
              }}
              selected={selectedMeditations[m._id] !== undefined}
            />
          ))}
        </Grid>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Card>
        <CardHeader title={isUpdate ? "Update Sequence" : "Create Sequence"} />
        <CardContent>
          <form className={classes.formRoot} autoComplete="off">
            <Grid container className={classes.gridContainer}>
              <Grid item className={classes.gridItem} xs={12}>
                <TextField
                  required
                  fullWidth
                  id="sequenceNameField"
                  color="secondary"
                  variant="outlined"
                  label="Sequence Name"
                  className={classes.nameField}
                  onChange={handleNameChange}
                  value={state.sequence.name}
                ></TextField>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <TextField
                  required
                  fullWidth
                  id="sequenceDescriptionField"
                  variant="outlined"
                  color="secondary"
                  label="Description"
                  onChange={handleDescriptionChange}
                  className={classes.sequenceDescriptionField}
                  multiline
                  rows={15}
                  value={state.sequence.description}
                ></TextField>
              </Grid>
              <Grid container direction="row" justify="flex-start">
                <Grid item className={classes.fileSelectRow} xs={6}>
                  {state.sequence.uploadKey === "" ? (
                    <Grid container>
                      <Grid item>
                        <Button
                          style={{ height: "100%" }}
                          size="large"
                          component="label"
                          variant="contained"
                          fullWidth
                        >
                          Choose{" "}
                          {isUpdate ? (
                            <div>&nbsp;New&nbsp;</div>
                          ) : (
                            <div>&nbsp;</div>
                          )}{" "}
                          Image
                          <input
                            type="file"
                            hidden
                            accept=".png,.jpg"
                            onChange={handleFileSelection}
                          ></input>
                        </Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container direction="row">
                      <Grid item xs={12}>
                        <TextField
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <Button
                                size="small"
                                onClick={() => {
                                  resetChooseMedia();
                                }}
                              >
                                <Cancel />
                              </Button>
                            ),
                          }}
                          fullWidth
                          value={state.audioFile.name}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
                <Grid item className={classes.fileSelectRow} xs={6}>
                  <Grid container justify="flex-end">
                    <Button
                      size="large"
                      variant="contained"
                      onClick={() => {
                        setShowMeditationSelector(true);
                      }}
                    >
                      Select Meditations
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <Tooltip
                  title={
                    <Typography>
                      Published series are discoverable by all users of Tempora.
                    </Typography>
                  }
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={state.sequence.isPublic}
                        size="medium"
                        onChange={handleIsPublicSelection}
                      />
                    }
                    label="Published"
                    labelPlacement="end"
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12} style={{ marginTop: 10 }}>
                <Typography variant="h6">Meditations</Typography>
              </Grid>
              <Grid item className={classes.gridItem} xs={12}>
                <List>
                  {Object.values(selectedMeditations).map((m, idx) => (
                    <ListItem divider>
                      <Grid container justify="flex-start" spacing={2}>
                        <Grid item spacing={10}>
                          <Typography variant="subtitle2">
                            {idx + 1}) {m.name}
                          </Typography>
                        </Grid>
                        <Grid item spacing={10} xs={9}>
                          <Typography
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {m.text}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions className={classes.cardFooter}>
          <Button
            disabled={!isSubmitEnabled}
            size="large"
            variant="outlined"
            style={{ height: 50 }}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </CardActions>
      </Card>
    </React.Fragment>
  );
};
