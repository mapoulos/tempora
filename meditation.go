package main

import (
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func handler(req events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	store := NewDynamoMeditationStore(os.Getenv("DDB_TABLE"), false, false)

	if req.RequestContext.HTTP.Path == "/upload-url" {
		return uploadHandler(req)
	}

	switch req.RequestContext.HTTP.Method {
	case "GET":
		if _, ok := req.PathParameters["meditationId"]; ok {
			// a get by medition id
			return GetMeditationHandler(req, &store)
		} else {
			// a listMeditations
			return ListMeditationHandler(req, &store)
		}
	case "POST":
		return CreateMeditationHandler(req, &store)
	case "PATCH":
		return UpdateMeditationHandler(req, &store)
	case "PUT":
		return UpdateMeditationHandler(req, &store)
	case "DELETE":
	default:
		return ListMeditationHandler(req, &store)
	}
	return ListMeditationHandler(req, &store)
}

func main() {
	validate = validator.New()

	lambda.Start(handler)
}
