package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func ListPublicSequencesHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get the sequences
	sequences, err := store.ListPublicSequences()
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&sequences)
	resp := string(responseBodyBytes)

	return successful(resp)
}

func GetPublicSequenceByIdHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get the sequences
	seqId, ok := req.PathParameters["sequenceId"]
	if !ok {
		return internalServerError("no sequenceId found for path parameter")
	}

	sequence, err := store.GetSequenceById(seqId)
	if err != nil {
		return internalServerError(err.Error())
	}
	if !sequence.Public {
		return notFound("no sequence found for id " + seqId)
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&sequence)
	resp := string(responseBodyBytes)

	return successful(resp)
}
