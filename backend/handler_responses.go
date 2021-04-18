package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
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

func entityCreated(msg string) *events.APIGatewayV2HTTPResponse {
	return &events.APIGatewayV2HTTPResponse{
		StatusCode:      201,
		IsBase64Encoded: false,
		Body:            msg,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}
