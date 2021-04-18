package main

import "github.com/aws/aws-lambda-go/events"

func DeleteMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get the userId
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// get the meditation id
	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		// if this happens, serverless.yml is incorrect
		return internalServerError("No {meditationId{} found in path parameters")
	}

	// attempt to delete the meditation
	err := store.DeleteMeditation(userId, meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found")
	}

	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      204,
		IsBase64Encoded: false,
		Body:            string(""),
		Headers:         map[string]string{},
	}
}
