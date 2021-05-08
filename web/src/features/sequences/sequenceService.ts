import { IdToken } from "@auth0/auth0-spa-js";
import { DateTime } from "luxon";
import { Meditation } from "../meditation/meditationService";

const base = import.meta.env.VITE_BACKEND_URL_BASE;

export type Sequence = {
  _createdAt: number;
  _id: string;
  _updatedAt: number;
  _userId: string;
  imageUrl: string;
  isPublic: boolean;
  name: string;
  description: string;
  meditations?: Meditation[];
};

export type SequenceDTO = {
  _createdAt: string;
  _id: string;
  _updatedAt: string;
  _userId: string;
  imageUrl: string;
  isPublic: boolean;
  name: string;
  description: string;
  meditations?: Meditation[];
};

export interface CreateSequenceInput {
  uploadKey: string;
  name: string;
  description: string;
  isPublic: boolean;
}

export interface UpdateSequenceInput extends CreateSequenceInput {
  _id: string;
}

export type GetUploadUrlResponse = {
  uploadKey: string;
  uploadUrl: string;
};

const mapDTOToSequence = (s: SequenceDTO): Sequence => ({
  ...s,
  _createdAt: DateTime.fromISO(s._createdAt).toMillis(),
  _updatedAt: DateTime.fromISO(s._updatedAt).toMillis(),
});

export const fetchPublicSequences = async (): Promise<Sequence[]> => {
  return fetch(`${base}/public/sequences`)
    .then((resp) => resp.json())
    .then((Sequences: Array<SequenceDTO>) => {
      return Sequences.map((m) => mapDTOToSequence(m));
    });
};

export const fetchPrivateSequences = async (
  token: IdToken
): Promise<Sequence[]> => {
  const rawToken = token.__raw;
  return fetch(`${base}/sequences`, {
    headers: {
      Authorization: rawToken,
    },
  })
    .then((resp) => resp.json())
    .then((sequences: Array<SequenceDTO>) => {
      return sequences.map((m) => mapDTOToSequence(m));
    });
};

export const uploadImage = async (
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

  const contentType = file.name.endsWith("png") ? "image/png" : "image/jpeg";

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  return uploadKey;
};

export const createSequence = async (
  input: CreateSequenceInput,
  token: IdToken
) => {
  const createSequenceResponse = await fetch(`${base}/sequences`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: token.__raw,
    },
  });

  const SequenceDTO = await createSequenceResponse.json();
  if (createSequenceResponse.status >= 400) {
    throw SequenceDTO;
  }
  return mapDTOToSequence(SequenceDTO);
};

export const updateSequence = async (
  input: UpdateSequenceInput,
  token: IdToken
) => {
  const { _id, ...body } = input;

  const updatedSequenceResponse = await fetch(`${base}/sequences/${_id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      Authorization: token.__raw,
    },
  });

  const SequenceDTO = await updatedSequenceResponse.json();
  if (updatedSequenceResponse.status >= 400) {
    throw SequenceDTO;
  }
  return mapDTOToSequence(SequenceDTO);
};

export const deleteSequenceById = async (
  sequenceId: string,
  token: IdToken
) => {
  await fetch(`${base}/sequences/${sequenceId}`, {
    method: "DELETE",
    headers: {
      Authorization: token.__raw,
    },
  });
};

export const fetchPublicSequenceById = async (sequenceId: string): Promise<Sequence> => {
  const resp = await fetch(`${base}/public/sequences/${sequenceId}`)
  const sequenceDTO: SequenceDTO = await resp.json()
  const sequence = mapDTOToSequence(sequenceDTO)

  return {
    ...sequence,
    meditations: sequence?.meditations ?? []
  }
}
