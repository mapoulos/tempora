package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func ListMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get the userId
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// list the meditations in the DB
	meditations, err := store.ListMeditations(userId)
	if err != nil {
		return internalServerError("Problem listing meditations for userId " + userId)
	}

	// build the response
	meditationJson, _ := json.Marshal(meditations)
	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	return &resp
}
