
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import {
	selectIsPublicMeditationsLoading,
	selectPublicMeditations
} from './meditationSlice'

export function MeditationTable() {
	const isLoading = useSelector(selectIsPublicMeditationsLoading)
	const publicMeditations = useSelector(selectPublicMeditations)

	const rows = publicMeditations.map((m) => (
		<tr key={m._id}><td>{m.name}</td><td>{m.text}</td></tr>
	))

	return (
		<div>
			<h3>Public Meditations</h3>
			<h5>Loading?: {isLoading.toString()}</h5>
			<table>
				<thead>
				<tr><th>Name</th><th>Text</th></tr>
				</thead>
				<tbody>
				{rows}
				</tbody>
			</table>

		</div>
	);
}