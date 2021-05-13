import {
  IconButton,
  Drawer,
  Button,
  Container,
  Typography,
  Hidden,
  WithWidth,
  CssBaseline,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@material-ui/core";

import React, { useEffect, useState } from "react";
import "./App.css";
import { AppBar } from "@material-ui/core";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link as RouterLink,
  useHistory,
} from "react-router-dom";
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
} from "@material-ui/core/styles";
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
import { SequencePage } from "./features/sequences/components/SequencePage";
import { PrivateSequenceListPage } from "./features/sequences/components/PrivateSequenceListPage";
import { CreateOrUpdateSequence } from "./features/sequences/components/CreateUpdateSequence";
import { MeditationSelector } from "./features/sequences/components/MeditationSelector";

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
  const theme = useTheme();
  const mdOrHigher = useMediaQuery(theme.breakpoints.up("md"));
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const history = useHistory();
  const { isAuthenticated, user, loginWithRedirect, getIdTokenClaims, logout } =
    useAuth0();

  useEffect(() => {
    dispatch(getIdToken(getIdTokenClaims));
  }, [isAuthenticated, user]);

  // on medium and higher, have the drawer always open.
  // on 'sm' and 'xs' use the hamburger icon
  const drawerVariant = mdOrHigher ? "permanent" : "temporary";
  const toggleDrawer = () => {
    isDrawerOpen ? setDrawerOpen(false) : setDrawerOpen(true);
  };

  const handleClose = () => {
    setMenuAnchor(null);
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
                onClick={(evt) => {
                  setMenuAnchor(evt.currentTarget);
                }}
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
        <Menu
          id="profile-menu"
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          keepMounted
          onClose={handleClose}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          style={{ textAlign: "left" }}
        >
          <MenuItem
            component={RouterLink}
            to="/private/meditations"
            onClick={() => handleClose()}
          >
            My Meditations
          </MenuItem>
          <MenuItem
            divider
            component={RouterLink}
            to="/private/sequences"
            onClick={() => handleClose()}
          >
            My Series
          </MenuItem>
          <MenuItem
            onClick={() => {
              logout({
                returnTo: window.location.href,
              });
            }}
          >
            Logout
          </MenuItem>
        </Menu>
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
                    Meditations
                  </Button>
                </ListItemText>
              </ListItem>
              <ListItem divider>
                <ListItemText>
                  <Button
                    component={RouterLink}
                    to="/sequences"
                    onClick={() => toggleDrawer()}
                  >
                    Series
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
        <Container className={classes.container}>
          <Switch>
            {/* Public "pages" */}
            <Route path="/about">
              <About />
            </Route>
            <Route path="/meditations">
              <PublicMeditationsPage />
            </Route>
            <Route path="/sequences/:sequenceId">
              <SequencePage isPublic={true} />
            </Route>
            <Route path="/sequences">
              <PublicSequenceListPage />
            </Route>

            {/* Private "pages" */}
            <Route path="/private/meditations/:meditationId/update">
              <CreateOrUpdateMeditation />
            </Route>
            <Route path="/private/meditations/create">
              <CreateOrUpdateMeditation />
            </Route>
            <Route path="/private/meditations">
              <PrivateMeditationsPage />
            </Route>
            <Route path="/private/sequences/create/select-meditations">
              <MeditationSelector />
            </Route>
            <Route path="/private/sequences/create">
              <CreateOrUpdateSequence />
            </Route>
            <Route path="/private/sequences/:sequenceId/update">
              <CreateOrUpdateSequence />
            </Route>
            <Route path="/private/sequences/:sequenceId">
              <SequencePage isPublic={false} />
            </Route>
            <Route path="/private/sequences">
              <PrivateSequenceListPage />
            </Route>

            {/* the medtitation timer*/}
            <Route path="/">
              <MeditationTimer />
            </Route>
          </Switch>
        </Container>
      </div>
    </Router>
  );
}

export default withWidth()(App);
