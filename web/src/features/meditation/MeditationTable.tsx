import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsPublicMeditationsLoading,
  selectPublicMeditations,
} from "./meditationSlice";
import { DataGrid } from "@material-ui/data-grid";

export function MeditationTable() {
  const isLoading = useSelector(selectIsPublicMeditationsLoading);
  const publicMeditations = useSelector(selectPublicMeditations);

  const rows = publicMeditations.map((m) => ({
    ...m,
    id: m._id,
  }));

  const columns = [
    {
      field: "name",
      headerName: "Name",
	  flex: 1
    },
    {
      field: "text",
      headerName: "Text",
	  flex: 3
    },
  ];

  return (
    <div style={{ display: "flex", height: "1000px" }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid rows={rows} columns={columns}></DataGrid>
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
