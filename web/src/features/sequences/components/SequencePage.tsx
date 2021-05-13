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
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { AppDispatch } from "../../../app/store";
import { Meditation } from "../../meditation/meditationService";
import { setCurrentMeditation } from "../../meditation/meditationSlice";
import { selectIdToken } from "../../user/userSlice";
import {
  deleteSequenceById,
  fetchPrivateSequenceById,
  fetchPublicSequenceById,
  Sequence,
} from "../sequenceService";
import { Link as RouterLink } from "react-router-dom";
import { deleteSequenceThunk } from "../sequenceSlice";
import { ExpandMore } from "@material-ui/icons";

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

interface SequencePageProps {
  isPublic: boolean;
}

export const SequencePage = ({ isPublic }: SequencePageProps) => {
  const [sequence, setSequence] = useState<null | Sequence>(null);
  const [isSequenceLoading, setIsSequenceLoading] = useState(true);
  const { sequenceId } = useParams<{ sequenceId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const idToken = useSelector(selectIdToken);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isPublic) {
      fetchPublicSequenceById(sequenceId).then((s) => {
        setSequence(s);
        setIsSequenceLoading(false);
      });
    } else {
      fetchPrivateSequenceById(sequenceId, idToken as IdToken)
        .then((s) => {
          setSequence(s);
          setIsSequenceLoading(false);
        })
        .catch(() => setIsSequenceLoading(false));
    }
  }, []);
  const classes = useStyles();
  const onMeditationSelect = (m: Meditation) => {
    dispatch(setCurrentMeditation(m));
    history.push("/");
  };

  const handleClose = () => {
    setMenuAnchor(null);
  };

  const handleDeleteDialogClose = (shouldDelete: boolean) => {
    if (shouldDelete && sequence !== null) {
      dispatch(deleteSequenceThunk(sequence?._id, idToken as IdToken));
      history.goBack()
    }
    setIsDeleteDialogOpen(false);
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
            <ButtonBase
              onClick={() => {
                onMeditationSelect(m);
              }}
            >
              <Typography variant="subtitle2">{m.name}</Typography>
            </ButtonBase>
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
          <Grid item xs={3}>
            <Grid container justify="flex-end">
              <Button
                onClick={() => {
                  onMeditationSelect(m);
                }}
              >
                Select
              </Button>
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
            <CardHeader
              title={sequence?.name}
              action={
                isPublic ? (
                  <div />
                ) : (
                  <Button
                    onClick={(evt) => {
                      setMenuAnchor(evt.currentTarget);
                    }}
                  >
                    <ExpandMore />
                  </Button>
                )
              }
            />
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
      <Menu
        id="edit-sequence-menu"
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        keepMounted
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MenuItem divider>
          <Button
            style={{ width: 120 }}
            component={RouterLink}
            hidden={sequence === null}
            to={`/private/sequences/${sequence?._id}/update`}
          >
            Edit
          </Button>
        </MenuItem>
        <MenuItem>
          <Button
            style={{ width: 120 }}
            onClick={() => {
              setIsDeleteDialogOpen(true);
            }}
          >
            Delete
          </Button>
        </MenuItem>
      </Menu>
      <Dialog open={isDeleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this series? This action&nbsp;<b>can not</b> &nbsp;be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDeleteDialogClose(false)}
            autoFocus
            variant="contained"
          >
            No
          </Button>
          <Button
            onClick={() => handleDeleteDialogClose(true)}
            color="secondary"
            variant="contained"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
