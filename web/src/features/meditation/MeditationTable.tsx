import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsPublicMeditationsLoading,
  selectPublicMeditations,
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
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";
import { Link as RouterLink } from "react-router-dom";
import { Meditation } from "./meditationService";

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
      color: "white"
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

export function MeditationTable() {
  const isLoading = useSelector(selectIsPublicMeditationsLoading);
  const publicMeditations = useSelector(selectPublicMeditations);
  const dispatch = useDispatch();
  const [value, setValue] = useState(0)
  const classes = useStyles();

  const chooseMeditation = (meditation: Meditation) => {
    dispatch(setCurrentMeditation(meditation));
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue)
  }

  if (isLoading) {
    return (
      <Grid container spacing={2} className={classes.spinner}>
        <div className={classes.toolbar} />

        <CircularProgress color="inherit" />
      </Grid>
    );
  }

  const meditationCards = publicMeditations.map((m) => (
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
      <AppBar position="static" color="inherit">
      <Tabs value={value} classes={{indicator: classes.indicator}} onChange={handleTabChange}>
        <Tab label="Public Meditations"></Tab>
        <Tab label="Personal Meditations"></Tab>
      </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
      </TabPanel>
      <TabPanel value={value} index={1}>
      <Grid container className={classes.selectorGrid} spacing={1}>
        {meditationCards}
      </Grid>
      </TabPanel>
      </React.Fragment>
  );
}
