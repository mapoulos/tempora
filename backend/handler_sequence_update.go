package main

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
)

func UpdateSequenceHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError()
	}

	// get the sequence
	sequenceId, ok := req.PathParameters["sequenceId"]
	if !ok {
		return internalServerError("sequenceId not found as path parameter")
	}
	sequence, err := store.GetSequenceById(sequenceId)
	if err != nil {
		return notFound("no sequence with id " + sequenceId + " was found")
	}
	if sequence.UserId != userId {
		return notFound("no sequence with id " + sequenceId + " was found")
	}

	// parse the request body
	input := UpdateSequenceInput{}

	err = json.Unmarshal([]byte(req.Body), &input)
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

	// validate the meditations exist and belong to this user
	meditations, err := store.GetMeditationsByIds(input.MeditationIDs)
	if err != nil {
		return badRequest("one or more of the meditationIDs does not exist")
	}
	for _, m := range meditations {
		if m.UserId != userId {
			return badRequest("one or more of the meditationIDs does not exist")
		}
	}

	// if an uploadKey is passed, ensure the key is in S3 an
	// move the image to `public/`
	now := time.Now()
	if input.UploadKey != "" {
		fileExt, err := ValidateImage(input.UploadKey, awsConfig)
		if err != nil {
			return badRequest("An image was never uploaded to the provided key.")
		}
		unixTime := strconv.FormatInt(now.Unix(), 10)
		imageName := sequenceId + "-" + unixTime + fileExt
		newPath := "public/" + imageName

		err = RenameImage(input.UploadKey, newPath, awsConfig)
		if err != nil {
			return internalServerError(err.Error())

		}
		sequence.ImageURL = mapPathSuffixToFullURL(imageName)
	}

	// update our values
	sequence.Name = input.Name
	sequence.Description = input.Description
	sequence.Public = input.Public
	sequence.UpdatedAt = now
	sequence.Meditations = meditations

	// save to DDB
	err = store.UpdateSequence(sequence)
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the response
	responseBodyBytes, _ := json.Marshal(&sequence)
	resp := successful(string(responseBodyBytes))

	return resp
}
