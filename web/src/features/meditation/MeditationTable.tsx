
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
		<tr><td>{m.name}</td><td>{m.text}</td></tr>
	))

	return (
		<div>
			<h3>Public Meditations</h3>
			<h5>Loading?: {isLoading}</h5>
			<table>
				<tr><th>Name</th><th>Text</th></tr>
				{rows}
			</table>

		</div>
	);
}