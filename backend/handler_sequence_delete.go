package main

import (
	"github.com/aws/aws-lambda-go/events"
)

func DeleteSequenceByIdHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
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

	// get the sequence to check the user
	sequence, err := store.GetSequenceById(sequenceId)
	if err != nil {
		return notFound("no sequence with id " + sequenceId + " was found")
	}
	if sequence.UserId != userId {
		return notFound("no sequence with id " + sequenceId + " was found")
	}

	// delete the sequence
	err = store.DeleteSequenceById(sequenceId)
	if err != nil {
		return notFound("no sequence with id " + sequenceId + " was found")
	}

	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      204,
		IsBase64Encoded: false,
		Body:            string(""),
		Headers:         map[string]string{},
	}
}
