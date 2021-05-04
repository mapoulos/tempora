package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func ListSequenceHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// get the sequences
	sequences, err := store.ListSequencesByUserId(userId)
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&sequences)
	resp := string(responseBodyBytes)

	return successful(resp)
}
