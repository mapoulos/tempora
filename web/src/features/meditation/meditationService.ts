import { IdToken } from "@auth0/auth0-spa-js";
import { DateTime } from "luxon";

const base = import.meta.env.VITE_BACKEND_URL_BASE;

export type Meditation = {
  _createdAt: number;
  _id: string;
  _updatedAt: number;
  _userId: string;
  audioUrl: string;
  isPublic: boolean;
  name: string;
  text: string;
};

export type MeditationDTO = {
  _createdAt: string;
  _id: string;
  _updatedAt: string;
  _userId: string;
  audioUrl: string;
  isPublic: boolean;
  name: string;
  text: string;
};

// export type UploadFile = {
//   uploadKey: string;
//   uploadUrl: string,
// }

export type GetUploadUrlResponse = {
  uploadKey: string;
  uploadUrl: string;
};

const mapDTOToMeditation = (m: MeditationDTO): Meditation => ({
  ...m,
  _createdAt: DateTime.fromISO(m._createdAt).toMillis(),
  _updatedAt: DateTime.fromISO(m._updatedAt).toMillis(),
});

export const fetchPublicMeditations = async (): Promise<Meditation[]> => {
  return fetch(`${base}/public/meditations`)
    .then((resp) => resp.json())
    .then((meditations: Array<MeditationDTO>) => {
      return meditations.map((m) => mapDTOToMeditation(m));
    });
};

export const fetchPrivateMeditations = async (
  token: IdToken
): Promise<Meditation[]> => {
  const rawToken = token.__raw;
  return fetch(`${base}/meditations`, {
    headers: {
      Authorization: rawToken,
    },
  })
    .then((resp) => resp.json())
    .then((meditations: Array<MeditationDTO>) => {
      return meditations.map((m) => mapDTOToMeditation(m));
    });
};

export const uploadAudio = async (
  file: File,
  token: IdToken
): Promise<string> => {
  const rawToken = token.__raw;
  const getUploadUrlResponse = await fetch(`${base}/upload-url`, {
    headers: {
      Authorization: rawToken,
    },
  });
  const { uploadUrl, uploadKey } = await getUploadUrlResponse.json();

  const contentType = (() => {
    if (file.name.endsWith(".mp3")) {
      return "audio/mpeg"
    }
    if (file.name.endsWith(".m4a")) {
      return "audio/mp4"
    }
    return "UNEXPECTED_CONTENT_TYPE"
  })()

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      'Content-Type' : contentType
    }
  });

  return uploadKey;
};

export interface CreateMeditationInput {
  uploadKey: string;
  name: string;
  text: string;
  isPublic: boolean;
}

export interface UpdateMeditationInput extends CreateMeditationInput {
	_id: string;
}

export const createMeditation = async (
  input: CreateMeditationInput,
  token: IdToken
) => {
  const createMeditationResponse = await fetch(`${base}/meditations`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: token.__raw,
    },
  });

  const meditationDTO = await createMeditationResponse.json();
  if (createMeditationResponse.status >= 400) {
	  throw meditationDTO
  }
  return mapDTOToMeditation(meditationDTO);
};

export const updateMeditation = async (
	input: UpdateMeditationInput,
	token: IdToken
  ) => {
	const {_id, ...body} =  input

	const updatedMeditationResponse = await fetch(`${base}/meditations/${_id}`, {
	  method: "PUT",
	  body: JSON.stringify(body),
	  headers: {
		Authorization: token.__raw,
	  },
	});

	const meditationDTO = await updatedMeditationResponse.json();
	if (updatedMeditationResponse.status >= 400) {
		throw meditationDTO
	}
	return mapDTOToMeditation(meditationDTO);
  };

export const deleteMeditationById = async (
  meditationId: string,
  token: IdToken
) => {
  await fetch(`${base}/meditations/${meditationId}`, {
    method: "DELETE",
    headers: {
      Authorization: token.__raw,
    },
  });
};
