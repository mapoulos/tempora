package main

import (
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func handler(req events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	store := NewDynamoMeditationStore(os.Getenv("DDB_TABLE"), false)

	switch req.RequestContext.HTTP.Path {
	case "/upload-url":
		return uploadHandler(req), nil
	case "/public/meditations":
		return ListPublicMeditationHandler(req, &store), nil
	}

	switch req.RequestContext.HTTP.Method {
	case "GET":
		if _, ok := req.PathParameters["meditationId"]; ok {
			// a get by medition id
			return GetMeditationHandler(req, &store), nil
		} else {
			// a listMeditations
			return ListMeditationHandler(req, &store), nil
		}
	case "POST":
		return CreateMeditationHandler(req, &store), nil
	case "PATCH":
		return UpdateMeditationHandler(req, &store), nil
	case "PUT":
		return UpdateMeditationHandler(req, &store), nil
	case "DELETE":
		return DeleteMeditationHandler(req, &store), nil
	default:
		return ListMeditationHandler(req, &store), nil
	}

}

func main() {
	validate = validator.New()
	validate.RegisterValidation("uploadKey", uploadKeyValidator)

	lambda.Start(handler)
}
