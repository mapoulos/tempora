import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsPublicMeditationsLoading,
  selectPublicMeditations,
} from "./meditationSlice";
import { Card, CardActions, CardContent, CardHeader } from "@material-ui/core";

export function MeditationTable() {
  const isLoading = useSelector(selectIsPublicMeditationsLoading);
  const publicMeditations = useSelector(selectPublicMeditations);

	const meditationCards = publicMeditations.map((m) => (
		<Card>
			<CardHeader title={m.name}/>
			<CardContent>{m.text}</CardContent>
			<CardActions><audio controls><source src={m.audioUrl} type="audio/mpeg"></source></audio></CardActions>
		</Card>
	))



  return (
    <div style={{ display: "flex", height: "1000px" }}>
      <div style={{ flexGrow: 1 }}>
	{meditationCards}
      </div>
    </div>
  );
}
