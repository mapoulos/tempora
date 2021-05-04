package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func ListPublicMeditationsHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// list the public meditations
	meditations, err := store.ListPublicMeditations()
	if err != nil {
		resp := events.APIGatewayV2HTTPResponse{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            err.Error(),
		}
		return &resp
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
