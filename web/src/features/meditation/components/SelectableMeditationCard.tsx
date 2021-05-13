import {
  ButtonBase,
  Grid,
  Typography,
} from "@material-ui/core";
import { Button } from "@material-ui/core";
import React from "react";
import { Meditation } from "../meditationService";
import CheckCircleOutlineOutlinedIcon from "@material-ui/icons/CheckCircleOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@material-ui/icons/RadioButtonUncheckedOutlined";


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
