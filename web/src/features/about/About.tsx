import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  createStyles,
  Link,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    toolbar: theme.mixins.toolbar,
  })
);

export default () => {
  const classes = useStyles()
  return (
    <div>
      <div className={classes.toolbar} />
      <Card>
        <CardHeader title="About" />
        <CardContent>
          <Typography style={{ paddingBottom: 10}}>
            To find out more about centering prayer, visit{" "}
            <Link
              underline="always"
              color="inherit"
              href="https://www.contemplative.org/contemplative-practice/centering-prayer/"
            >
              www.contemplative.org.
            </Link>
          </Typography>

          <Typography variant="subtitle2" style={{ marginBottom: -10}}>Credits</Typography>
          <List>
            <ListItem>
              <ListItemText>
                <Link
                  href="https://www.flaticon.com/free-icon/candle-burning-flame_31101"
                  color="inherit"
                  underline="always"
                >
                  Favicon.
                </Link>
              </ListItemText>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </div>
  );
};
