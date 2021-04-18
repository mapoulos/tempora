package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	uuid "github.com/satori/go.uuid"
)

func userIdNotFoundError() *events.APIGatewayV2HTTPResponse {
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      500,
		IsBase64Encoded: false,
		Body:            "userId not found from authorizer",
	}
}

func notFound(msg string) *events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{
		"error": msg,
	})
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      404,
		IsBase64Encoded: false,
		Body:            string(body),
	}
}

func badRequest(msg string) *events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{
		"error": msg,
	})
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      400,
		IsBase64Encoded: false,
		Body:            string(body),
	}
}

func internalServerError(msg string) *events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{
		"error": msg,
	})
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      500,
		IsBase64Encoded: false,
		Body:            string(body),
	}
}

func CreateMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	// get user id
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
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
		}, nil
	}

	// validate the request body
	err = validate.Struct(input)
	if err != nil {
		return badRequest(err.Error()), nil
	}

	// ensure the key is in s3 and that we have an mp3
	err = ValidateMP3(input.UploadKey)
	if err != nil {
		return badRequest(err.Error()), nil
	}

	u4 := uuid.NewV4()
	now := time.Now()

	// move the mp3 to public and rename
	newPath := "public/" + u4.String() + ".mp3"
	err = RenameMP3(input.UploadKey, newPath)
	if err != nil {
		return internalServerError(err.Error()), nil
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

	err = store.SaveMeditation(newMeditation)
	if err != nil {
		resp := events.APIGatewayV2HTTPResponse{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            err.Error(),
		}
		return &resp, nil
	}

	response, _ := json.Marshal(&newMeditation)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      201,
		IsBase64Encoded: false,
		Body:            string(response),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	return &resp, nil
}

func ListMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
	}

	meditations, err := store.ListMeditations(userId)
	if err != nil {
		resp := events.APIGatewayV2HTTPResponse{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            err.Error(),
		}
		return &resp, nil
	}

	meditationJson, _ := json.Marshal(meditations)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	return &resp, nil
}

func ListPublicMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	meditations, err := store.ListPublicMeditations()
	if err != nil {
		resp := events.APIGatewayV2HTTPResponse{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            err.Error(),
		}
		return &resp, nil
	}

	meditationJson, _ := json.Marshal(meditations)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	return &resp, nil
}

func GetMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
	}

	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		return internalServerError("No {meditationId{} found in path parameters"), nil
	}
	meditation, err := store.GetMeditation(userId, meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found"), nil
	}

	meditationJson, _ := json.Marshal(meditation)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	return &resp, nil
}

func UpdateMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
	}

	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		return internalServerError("No {meditationId{} found in path parameters"), nil
	}
	meditation, err := store.GetMeditation(userId, meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found"), nil
	}

	newMeditationInput := CreateMeditationInput{}
	fmt.Println(newMeditationInput)

	err = json.Unmarshal([]byte(req.Body), &newMeditationInput)
	if err != nil {
		return badRequest(err.Error()), nil
	}
	err = validate.Struct(newMeditationInput)
	if err != nil {
		return badRequest(err.Error()), nil
	}

	// ensure the key is in s3 and that we have an mp3
	if newMeditationInput.UploadKey != "" {
		err = ValidateMP3(newMeditationInput.UploadKey)
		newPath := "public/" + meditation.ID + ".mp3"
		if err != nil {
			return badRequest(err.Error()), nil
		}
		err = RenameMP3(newMeditationInput.UploadKey, newPath)
		if err != nil {
			return internalServerError("Could not rename mp3"), nil
		}
	}

	meditation.UpdatedAt = time.Now()
	meditation.Name = newMeditationInput.Name
	meditation.Text = newMeditationInput.Text
	meditation.Public = newMeditationInput.Public

	store.UpdateMeditation(meditation)

	responseJson, _ := json.Marshal(meditation)

	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(responseJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func DeleteMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
	}

	meditationId, ok := req.PathParameters["meditationId"]
	if !ok {
		return internalServerError("No {meditationId{} found in path parameters"), nil
	}
	err := store.DeleteMeditation(userId, meditationId)
	if err != nil {
		return notFound("No meditation with id " + meditationId + " was found"), nil
	}

	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      204,
		IsBase64Encoded: false,
		Body:            string(""),
		Headers:         map[string]string{},
	}, nil

}

type UploadResponse struct {
	URL string `json:"uploadUrl"`
	Key string `json:"uploadKey"`
}

func uploadHandler(req events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	region := os.Getenv("AWS_REGION")
	sess, _ := session.NewSession(&aws.Config{
		Region: &region,
	})

	svc := s3.New(sess)
	bucketName := os.Getenv("AUDIO_BUCKET")
	key := "upload/" + uuid.NewV4().String()

	s3req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	})

	url, err := s3req.Presign(15 * time.Minute)
	if err != nil {
		return &events.APIGatewayV2HTTPResponse{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            string(err.Error()),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	uploadReponse := UploadResponse{
		URL: url,
		Key: key,
	}

	responseJson, _ := json.Marshal(uploadReponse)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(responseJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	return &resp, nil
}
