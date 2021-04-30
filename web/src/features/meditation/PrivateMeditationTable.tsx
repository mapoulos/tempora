import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  deleteMeditationThunk,
  fetchPrivateMeditationsThunk,
  selectIsPrivateMeditationsLoading,
  selectPrivateMeditations,
  setCurrentMeditation,
} from "./meditationSlice";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Paper,
  Tabs,
  Tab,
  Theme,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import { createStyles, makeStyles } from "@material-ui/styles";
import { Link as RouterLink } from "react-router-dom";
import { Meditation } from "./meditationService";
import { selectIdToken } from "../user/userSlice";
import { IdToken, useAuth0 } from "@auth0/auth0-react";
import { AppDispatch } from "../../app/store";
import { keys } from "@material-ui/core/styles/createBreakpoints";
import { ArrowDropDown, ExpandMore } from "@material-ui/icons";

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
      //  background: theme.palette.primary.dark,
      //  background: theme.palette.grey[700],
      padding: 10,
      textAlign: "center",
    },
    appBar: {
      background: theme.palette.grey[600],
    },
    title: {
      flexGrow: 1,
    },
    toolbar: theme.mixins.toolbar,
  })
);

export function PrivateMeditationTable() {
  const isLoading = useSelector(selectIsPrivateMeditationsLoading);
  const privateMeditations = useSelector(selectPrivateMeditations);
  const idToken = useSelector(selectIdToken);
  const { isAuthenticated } = useAuth0();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const dispatch = useDispatch<AppDispatch>();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(
    {} as Meditation
  );


  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (idToken === undefined) {
      console.error(
        "idToken == undefined. We're really not expecting this to happen."
      );
    }
    dispatch(fetchPrivateMeditationsThunk(idToken as IdToken));
  }, [isAuthenticated]);

  const chooseMeditation = (meditation: Meditation) => {
    dispatch(setCurrentMeditation(meditation));
  };

  const handleDeleteDialogClose = (shouldDelete: boolean) => {
    if (shouldDelete) {
      dispatch(
        deleteMeditationThunk(selectedMeditation._id, idToken as IdToken)
      );
    }
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteDialogOpen = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleOpen = (evt: React.MouseEvent<HTMLButtonElement>, meditation: Meditation) => {
    setSelectedMeditation(meditation)
    setMenuAnchor(evt.currentTarget)
  }

  const handleClose = () => {
    setMenuAnchor(null)
  }

  const classes = useStyles();

  if (isLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }

  if (!isAuthenticated) {
    return (
      <React.Fragment>
        <div className={classes.toolbar} />
        <Typography>Please login to view your personal meditations.</Typography>
      </React.Fragment>
    );
  }

  const meditationCards = privateMeditations.map((m) => (
    <Grid item xs={12} md={12} key={m._id}>
      <Card>
        <CardHeader title={m.name}
          action={<Button
            aria-controls="simple-menu"
            aria-haspopup="true"
            key={m._id}
            size="large"
            onClick={(evt) => { handleOpen(evt, m) }}>
            <ExpandMore />
          </Button>
        } />
        <CardContent>{m.text}</CardContent>
        <CardActions className={classes.cardActions}>


          <Button
            variant="outlined"
            onClick={() => chooseMeditation(m)}
            component={RouterLink}
            to="/"
          >
            Select
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <AppBar position="static" className={classes.appBar}>
        <Toolbar style={{ flexGrow: 1 }}>
          <Typography variant="h6" className={classes.title}>
            My Meditations
          </Typography>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/create-meditation"
          >
            <AddIcon />
          </Button>
        </Toolbar>
      </AppBar>
      <Menu id={`edit-menu`} anchorEl={menuAnchor} open={Boolean(menuAnchor)} keepMounted onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MenuItem><Button
          
          style={{width: 120}}
          component={RouterLink}
          to={`/meditations/${selectedMeditation._id}/update`}
        >
          Edit
        </Button></MenuItem>
        <MenuItem><Button
          style={{width: 120}}
          onClick={() => {
            handleDeleteDialogOpen();
          }}
        >
          Delete
        </Button></MenuItem>
      </Menu>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
      <Dialog open={isDeleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this meditation? This action
            <b>can not</b> be undone.
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
}
