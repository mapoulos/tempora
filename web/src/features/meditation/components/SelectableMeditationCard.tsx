import {
  ButtonBase,
  CardActions,
  CardHeader,
  createStyles,
  Grid,
  List,
  ListItem,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
  Typography,
} from "@material-ui/core";
import { Button } from "@material-ui/core";
import { CardContent } from "@material-ui/core";
import { Card } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import React, { useState } from "react";
import { Meditation } from "../meditationService";
import CheckCircleOutlineOutlinedIcon from "@material-ui/icons/CheckCircleOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@material-ui/icons/RadioButtonUncheckedOutlined";

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
      padding: 10,
      textAlign: "center",
    },
    appBar: {
      background: theme.palette.grey[600],
    },
    cardSelected: {},
  })
);

interface SelectableMeditationCardProps {
  meditation: Meditation;
  onSelect: (meditation: Meditation) => void;
  selected: boolean;
}
export const SelectableMeditationCard = ({
  meditation,
  onSelect,
  selected,
}: SelectableMeditationCardProps) => {
  const classes = useStyles();

  return (
      <Grid item xs={12} md={6}>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={9}>
            <ButtonBase
              onClick={() => {
                onSelect(meditation);
              }}
            >
              <Typography variant="subtitle2">{meditation.name}</Typography>
            </ButtonBase>
            <Typography
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {meditation.text}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Grid container justify="flex-end">
              <Button
                onClick={() => {
                  onSelect(meditation);
                }}
              >
                {(selected) ? <CheckCircleOutlineOutlinedIcon /> : <RadioButtonUncheckedOutlinedIcon/>}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
  );
  // return (
  //   <React.Fragment>
  // 	<Card>
  // 	  <CardHeader
  // 		title={meditation.name}
  // 		action={
  // 			 <Button>{(selected) ? <CheckCircleOutlineOutlinedIcon /> : <RadioButtonUncheckedOutlinedIcon /> } </Button>
  // 		}
  // 	  />
  // 	  <ButtonBase onClick={() => {onSelect(meditation)}}>
  // 	  <CardContent>{meditation.text}</CardContent>
  // 	  </ButtonBase>
  // 	  <CardActions className={classes.cardActions}>
  // 		<Button
  // 		  variant="outlined"
  // 		  onClick={() => {
  // 			onSelect(meditation);
  // 		  }}
  // 		>
  // 		  Select
  // 		</Button>
  // 	  </CardActions>
  // 	</Card>
  //   </React.Fragment>
  // );
};
