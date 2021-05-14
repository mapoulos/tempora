package main

import (
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/segmentio/ksuid"
)

func CreateMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// parse the request body
	input := CreateMeditationInput{}

	err := json.Unmarshal([]byte(req.Body), &input)
	if err != nil {
		errorMessage := "Invalid request " + err.Error()
		bodyError := map[string]string{
			"error": errorMessage,
		}
		body, _ := json.Marshal(bodyError)
		return &events.APIGatewayV2HTTPResponse{
			StatusCode:      400,
			IsBase64Encoded: false,
			Body:            string(body),
		}
	}

	// validate the request body
	err = validate.Struct(input)
	if err != nil {
		return badRequest(err.Error())
	}

	// ensure the key is in s3 and that we have an mp3
	fileExt, err := ValidateAudio(input.UploadKey, awsConfig)
	if err != nil {
		return badRequest("Provided file is not a properly encoded mp3.")
	}

	id := ksuid.New().String()
	now := time.Now()

	// move the mp3 to public and rename
	suffix := id + fileExt // e.g. 1235456.m4a
	newPath := "public/" + suffix

	err = RenameAudio(input.UploadKey, newPath, awsConfig)
	if err != nil {
		return internalServerError(err.Error())
	}

	newMeditation := Meditation{
		ID:        id,
		URL:       mapPathSuffixToFullURL(suffix),
		Name:      input.Name,
		Text:      input.Text,
		Public:    input.Public,
		UserId:    userId,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// save to DDB
	err = store.SaveMeditation(newMeditation)
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&newMeditation)
	resp := entityCreated(string(responseBodyBytes))

	return resp
}
