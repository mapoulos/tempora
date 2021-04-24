import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
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
} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import { createStyles, makeStyles } from "@material-ui/styles";
import { Link as RouterLink } from "react-router-dom";
import { Meditation } from "./meditationService";
import { selectIdToken } from "../user/userSlice";
import { IdToken, useAuth0 } from "@auth0/auth0-react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cardActions: {
      flex: 1,
      width: "100%",
      flexDirection: "row-reverse",
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export function PrivateMeditationTable() {
  const isLoading = useSelector(selectIsPrivateMeditationsLoading);
  const privateMeditations = useSelector(selectPrivateMeditations);
  const idToken = useSelector(selectIdToken);
  const { isAuthenticated } = useAuth0();
  const dispatch = useDispatch();
  const [value, setValue] = useState(0);
  const classes = useStyles();

  useEffect(() => {
	if (!isAuthenticated) { return; }
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

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

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
        <CardHeader title={m.name} />
        <CardContent>{m.text}</CardContent>
        <CardActions className={classes.cardActions}>
          <Button
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
    // <Paper square>
    <React.Fragment>
      <div className={classes.toolbar} />
      <AppBar position="static" className={classes.appBar}>
        <Toolbar style={{ flexGrow: 1 }}>
          <Typography variant="h6" className={classes.title}>
            My Meditations
          </Typography>
		  <Button variant="outlined"><AddIcon/></Button>
        </Toolbar>
      </AppBar>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
    </React.Fragment>
  );
}
