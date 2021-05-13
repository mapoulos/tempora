import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Grid,
  Theme,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/styles";
import { useHistory } from "react-router-dom";
import { Meditation } from "../../meditation/meditationService";

import { AppDispatch } from "../../../app/store";
import { SelectableMeditationCard } from "../../meditation/components/SelectableMeditationCard";
import { Save } from "@material-ui/icons";
import { selectMeditationSelectorMeditations, setSelectedMeditations } from "../sequenceSlice";
import { selectPrivateMeditations } from "../../meditation/meditationSlice";

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
      background: "inherit",
    },
    title: {
      flexGrow: 1,
    },
    toolbar: theme.mixins.toolbar,
    buttonRow: {
      marginBottom: 10,
    },
  })
);




export function MeditationSelector() {
  const privateMeditations = useSelector(selectPrivateMeditations)
  const initialMeditations = useSelector(selectMeditationSelectorMeditations)
  const [selectedMeditations, setInprogressSelectedMeditations] = useState(
    initialMeditations.reduce((acc: Record<string,Meditation>,  m: Meditation): Record<string,Meditation> => {
      acc[m._id] = m;
      return acc
    },{})
  );
  const history = useHistory()
  const dispatch = useDispatch()
  const classes = useStyles();

  const meditationCards = privateMeditations.map((m) => (

      <SelectableMeditationCard
        meditation={m}
        key={m._id}
        onSelect={(meditation) => {
          if(selectedMeditations[meditation._id] === undefined) {
            setInprogressSelectedMeditations({
              ...selectedMeditations,
              [meditation._id] : meditation,
            })
          } else {
            delete selectedMeditations[meditation._id]
            setInprogressSelectedMeditations({
             ...selectedMeditations
            })
          }

        }}
        selected={selectedMeditations[m._id] !== undefined }
      />
  ));

  return (
    <React.Fragment>
      <div className={classes.toolbar} />
      <Grid container className={classes.selectorGrid} spacing={1}>
      <Grid item xs={12} className={classes.buttonRow}>
          <Grid container direction="row-reverse">
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                console.log(Object.values(selectedMeditations))
                dispatch(setSelectedMeditations(Object.values(selectedMeditations)))
                history.goBack()
              }}
            >
              Save&nbsp;
              <Save />
            </Button>
          </Grid>
        </Grid>
        {meditationCards}
      </Grid>
    </React.Fragment>
  );
}
