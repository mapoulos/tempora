package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	uuid "github.com/satori/go.uuid"
)

func userIdNotFoundError() *events.APIGatewayV2HTTPResponse {
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      500,
		IsBase64Encoded: false,
		Body:            "userId not found from authorizer",
	}
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

func CreateMeditationHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) (*events.APIGatewayV2HTTPResponse, error) {
	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
	if !ok {
		return userIdNotFoundError(), nil
	}

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

	// if err := c.ShouldBindJSON(&input); err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	// }

	u4 := uuid.NewV4()

	now := time.Now()

	newMeditation := Meditation{
		ID:        u4.String(),
		URL:       input.URL,
		Name:      input.Name,
		Text:      input.Text,
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
