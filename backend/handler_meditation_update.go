package main

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
)

func UpdateMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// Get the userId from headers
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// Get the meditationId from path
	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		return internalServerError("No {meditationId{} found in path parameters")
	}

	// Get the meditation from the DB
	meditation, err := store.GetMeditation(meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found")
	}
	if meditation.UserId != userId {
		return notFound("No meditation with id " + meditationId + " was found")
	}

	// Parse and validate the request body
	newMeditationInput := UpdateMeditationInput{}
	err = json.Unmarshal([]byte(req.Body), &newMeditationInput)
	if err != nil {
		// couldn't even unmarshal the json
		return badRequest(err.Error())
	}
	err = validate.Struct(newMeditationInput)
	if err != nil {
		// failed validation
		return badRequest(err.Error())
	}
	now := time.Now()
	// if we have a non-zero upload key, that means
	// we need to run through the validate -> copy to public prefix logic
	if newMeditationInput.UploadKey != "" {
		fileExt, err := ValidateAudio(newMeditationInput.UploadKey, awsConfig)
		if err != nil {
			return badRequest("Provided file is not a properly encoded mp3 or m4a.")
		}
		unixTime := strconv.FormatInt(now.Unix(), 10)
		suffix := meditation.ID + "-" + unixTime + fileExt
		newPath := "public/" + suffix

		meditation.URL = mapPathSuffixToFullURL(suffix)
		err = RenameAudio(newMeditationInput.UploadKey, newPath, awsConfig)
		if err != nil {
			return internalServerError("Could not rename audio file")
		}
	}

	// Update the medtation with the provided values
	// and save in the DB
	meditation.UpdatedAt = time.Now()
	meditation.Name = newMeditationInput.Name
	meditation.Text = newMeditationInput.Text
	meditation.Public = newMeditationInput.Public
	store.UpdateMeditation(meditation)

	// build the response
	responseJson, _ := json.Marshal(meditation)
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(responseJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}
