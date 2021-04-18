package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func GetMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get the user ID
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// get the meditation
	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		return internalServerError("No {meditationId{} found in path parameters")
	}
	meditation, err := store.GetMeditation(userId, meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found")
	}

	// build the response
	meditationJson, _ := json.Marshal(meditation)
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
