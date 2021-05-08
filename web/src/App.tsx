import {
  IconButton,
  Drawer,
  Button,
  Container,
  Typography,
  Hidden,
  WithWidth,
  isWidthUp,
  CssBaseline,
  useMediaQuery,
} from "@material-ui/core";

import React, { useEffect, useState } from "react";
import "./App.css";
import { AppBar } from "@material-ui/core";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link as RouterLink,
} from "react-router-dom";
import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import About from "./features/about/About";
import { MeditationTimer } from "./features/meditation/components/MeditationTimer";
import withWidth from "@material-ui/core/withWidth";
import { useAuth0 } from "@auth0/auth0-react";
import { getIdToken } from "./features/user/userSlice";
import { useDispatch } from "react-redux";
import { CreateOrUpdateMeditation } from "./features/meditation/components/CreateUpdateMeditation";
import { PrivateMeditationsPage } from "./features/meditation/components/PrivateMeditationsPage";
import { PublicMeditationsPage } from "./features/meditation/components/PublicMeditationsPage";
import { PublicSequenceListPage } from "./features/sequences/components/PublicSequenceListPage";
import { PublicSequencePage } from "./features/sequences/components/PublicSequencePage";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      position: "absolute",
      display: "flex",
      height: "100%",
      width: "100%",
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
    toolbar: {
      background: theme.palette.grey[900],
      zIndex: theme.zIndex.drawer + 1,
    },
    list: {
      width: 300,
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    drawer: {
      flexShrink: 0,
      width: 300,
    },
    drawerContainer: {
      overflow: "auto",
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
  })
);

function App(props: WithWidth) {
  const classes = useStyles();
  // const { width } = props;
  const theme = useTheme()
  const mdOrHigher = useMediaQuery(theme.breakpoints.up('md'))
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const {
    isAuthenticated,
    user,
    loginWithRedirect,
    getIdTokenClaims,
  } = useAuth0();

  useEffect(() => {
    dispatch(getIdToken(getIdTokenClaims));
  }, [isAuthenticated, user]);

  // on medium and higher, have the drawer always open.
  // on 'sm' and 'xs' use the hamburger icon
  const drawerVariant = mdOrHigher ? "permanent" : "temporary";
  const toggleDrawer = () => {
    isDrawerOpen ? setDrawerOpen(false) : setDrawerOpen(true);
  };

  return (
    <Router>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.toolbar}>
          <Toolbar>
            <Hidden mdUp>
              <IconButton
                edge="start"
                className={classes.menuButton}
                aria-label="menu"
                onClick={toggleDrawer}
              >
                <MenuIcon />
              </IconButton>
            </Hidden>
            <Typography variant="h6" className={classes.title}>
              Tempora
            </Typography>
            {isAuthenticated ? (
              <IconButton
                edge="end"
                area-label="account of current user"
                aria-haspopup="true"
              >
                <AccountCircle />

              </IconButton>
            ) : (
              <Button color="inherit" onClick={() => loginWithRedirect()}>
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Drawer
          variant={drawerVariant}
          open={isDrawerOpen}
          onClose={toggleDrawer}
          className={classes.drawer}
        >
          <div className={classes.drawerContainer}>
            <Toolbar className={classes.toolbar}>
              <Typography variant="h6" className={classes.title}>
                Tempora
              </Typography>
            </Toolbar>
            <List className={classes.list}>
              <ListItem>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/"
                    onClick={() => toggleDrawer()}
                  >
                    Home
                  </Button>
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/meditations"
                    onClick={() => toggleDrawer()}
                  >
                    Public Meditations
                  </Button>
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/public/sequences"
                    onClick={() => toggleDrawer()}
                  >
                    Public Sequences
                  </Button>
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/private-meditations"
                    onClick={() => toggleDrawer()}
                  >
                    My Meditations
                  </Button>
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/about"
                    onClick={() => toggleDrawer()}
                  >
                    About
                  </Button>
                </ListItemText>
              </ListItem>
            </List>
          </div>
        </Drawer>
        {/* <main className={classes.content}> */}
        <Container className={classes.container}>
          <Switch>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/meditations/:meditationId/update">
              <CreateOrUpdateMeditation />
            </Route>
            <Route path="/meditations">
              <PublicMeditationsPage />
            </Route>
            <Route path="/private-meditations">
              <PrivateMeditationsPage />
            </Route>
            <Route path="/public/sequences/:sequenceId">
              <PublicSequencePage />
            </Route>
            <Route path="/public/sequences">
              <PublicSequenceListPage />
            </Route>

            <Route path="/create-meditation">
              <CreateOrUpdateMeditation />
            </Route>

            <Route path="/">
              <MeditationTimer />
            </Route>
          </Switch>
        </Container>
        {/* </main> */}
      </div>
    </Router>
  );
}

export default withWidth()(App);
