import {DateTime} from 'luxon'

const base = import.meta.env.VITE_BACKEND_URL_BASE;

export type Meditation = {
	_createdAt: DateTime,
	_id: string,
	_updatedAt: DateTime,
	_userId: string,
	audioUrl: string,
	isPublic: boolean,
	name: string,
	text: string,
}

export type MeditationDTO = {
	_createdAt: string,
	_id: string,
	_updatedAt: string,
	_userId: string,
	audioUrl: string,
	isPublic: boolean,
	name: string,
	text: string,
}

const mapDTOToMeditation = (m: MeditationDTO): Meditation => ({
	...m,
	_createdAt: DateTime.fromISO(m._createdAt),
	_updatedAt: DateTime.fromISO(m._updatedAt)
})

export const fetchPublicMeditations = async (): Promise<Meditation[]> => {
	return fetch(`${base}/public/meditations`)
		.then((resp) => resp.json())
		.then((meditations: Array<MeditationDTO>) => {
			return meditations.map((m) => mapDTOToMeditation(m))
		})
}