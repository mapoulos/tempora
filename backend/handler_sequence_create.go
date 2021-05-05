package main

import (
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/segmentio/ksuid"
)

func CreateSequenceHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// parse the request body
	input := CreateSequenceInput{}

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

	// ensure the key is in s3
	fileExt, err := ValidateImage(input.UploadKey, awsConfig)
	if err != nil {
		return badRequest("An image was never uploaded to the provided key.")
	}

	id := ksuid.New().String()
	now := time.Now()

	// move the image to public and rename
	imageName := id + fileExt
	newPath := "public/" + imageName

	err = RenameImage(input.UploadKey, newPath, awsConfig)
	if err != nil {
		return internalServerError(err.Error())
	}

	meditations, err := store.GetMeditationsByIds(input.MeditationIDs)
	for _, m := range meditations {
		if m.UserId != userId {
			return badRequest("one or more of the meditationIDs does not exist")
		}
	}
	if err != nil {
		return internalServerError(err.Error())
	}
	if len(meditations) != len(input.MeditationIDs) {
		return badRequest("one or more of the meditationIDs does not exit")
	}

	newSequence := Sequence{
		ID:          id,
		ImageURL:    mapPathSuffixToFullURL(imageName),
		Name:        input.Name,
		Description: input.Description,
		Public:      input.Public,
		UserId:      userId,
		CreatedAt:   now,
		UpdatedAt:   now,
		Meditations: meditations,
	}

	// save to DDB
	err = store.SaveSequence(newSequence)
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&newSequence)
	resp := entityCreated(string(responseBodyBytes))

	return resp
}
