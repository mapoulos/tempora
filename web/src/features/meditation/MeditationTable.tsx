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

//   const rows = publicMeditations.map((m) => ({
//     ...m,
//     id: m._id,
// 	audio: (
// 		<audio controls><source src={m.audioUrl} type="audio/mpeg"></source></audio>
// 	)
//   }));

//   const columns = [
//     {
//       field: "name",
//       headerName: "Name",
// 	  flex: 1
//     },
//     {
//       field: "text",
//       headerName: "Text",
// 	  flex: 3
//     },
// 	{
// 		field: "audio",
// 		headerName: "audio",
// 		flex: 3
// 	},
//   ];

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

  // return (
  // 	<div>
  // 		<h3>Public Meditations</h3>
  // 		<h5>Loading?: {isLoading.toString()}</h5>
  // 		<table>
  // 			<thead>
  // 			<tr><th>Name</th><th>Text</th></tr>
  // 			</thead>
  // 			<tbody>
  // 			{rows}
  // 			</tbody>
  // 		</table>

  // 	</div>
  // );
}
