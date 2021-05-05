package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func GetSequenceByIdHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// get the sequence Id
	sequenceId, ok := req.PathParameters["sequenceId"]
	if !ok {
		return badRequest("no :sequenceId found as a path parameter")
	}

	// get the sequences
	sequence, err := store.GetSequenceById(sequenceId)
	if err != nil {
		return notFound("no sequence with id " + sequenceId + " was found")
	}
	if sequence.UserId != userId {
		return notFound("no sequence with id " + sequenceId + " was found")
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&sequence)
	resp := string(responseBodyBytes)

	return successful(resp)
}
