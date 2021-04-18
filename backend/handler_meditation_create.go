package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	uuid "github.com/satori/go.uuid"
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
		fmt.Println("Could not parse body")
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
	err = ValidateMP3(input.UploadKey)
	if err != nil {
		return badRequest("Provided file is not a properly encoded mp3.")
	}

	u4 := uuid.NewV4()
	now := time.Now()

	// move the mp3 to public and rename
	newPath := "public/" + u4.String() + ".mp3"
	err = RenameMP3(input.UploadKey, newPath)
	if err != nil {
		return internalServerError(err.Error())
	}

	newMeditation := Meditation{
		ID:        u4.String(),
		URL:       mapUUIDToPublicURL(u4.String()),
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
