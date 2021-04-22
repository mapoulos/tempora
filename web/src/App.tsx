import { Box, Card, CardContent, CardHeader, IconButton, Drawer, Link, Button, Container} from "@material-ui/core";

import React, { useState } from "react";
import "./App.css";
import { MeditationTable } from "./features/meditation/MeditationTable";
import { AppBar } from "@material-ui/core";
import { BrowserRouter as Router, Switch, Route, Link as RouterLink } from "react-router-dom";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import About from "./features/about/About";
import { MeditationTimer } from "./features/meditation/MeditationTimer";



const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      position: 'absolute',
      height: '100%',
      width: "100%"
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
    toolbar: {
      background: theme.palette.grey[900],
      marginBottom: 20
    },
    list: {
      width: 300,
    },
    container: {
      maxWidth: 1000,
      height: "100vh"
    }
  }),
);

function App() {
  const classes = useStyles();

  const [isDrawerOpen, setDrawerOpen] = useState(false)

  const toggleDrawer = () => { isDrawerOpen ? setDrawerOpen(false) : setDrawerOpen(true)}

  return (
    <Router>
      <div className={classes.root}>
      <AppBar position="fixed" className={classes.toolbar}>
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} aria-label="menu" onClick={toggleDrawer}><MenuIcon /></IconButton>
          <Drawer open={isDrawerOpen} onClose={toggleDrawer}>
            <List className={classes.list}>
              <ListItem><ListItemText><Button component={RouterLink} to="/" onClick={() => toggleDrawer()}>Home</Button></ListItemText></ListItem>
              <ListItem><ListItemText><Button component={RouterLink} to="/meditations" onClick={() => toggleDrawer()}>Meditations</Button></ListItemText></ListItem>
              <ListItem><ListItemText><Button component={RouterLink} to="/about" onClick={() => toggleDrawer()}>About</Button></ListItemText></ListItem>
              </List>
          </Drawer>
        </Toolbar>
        </AppBar>
        <Container className={classes.container}>
      <Switch>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/meditations">
          <MeditationTable />
        </Route>
        <Route path="/">
          <MeditationTimer />
        </Route>
      </Switch>
      </Container>

      </div>
    </Router>
  );
}

export default App;
