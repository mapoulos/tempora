package main

import (
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(req events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	store := NewDynamoMeditationStore(os.Getenv("DDB_TABLE"), false, false)

	switch req.RequestContext.HTTP.Method {
	case "GET":
		if _, ok := req.PathParameters["meditationId"]; ok {
			// a get by medition id
		} else {
			// a listMeditations
			return ListMeditationHandler(req, &store)
		}
	case "POST":
		return CreateMeditationHandler(req, &store)
	case "PATCH":
	case "PUT":
	case "DELETE":
	default:
		return ListMeditationHandler(req, &store)
	}
	return ListMeditationHandler(req, &store)
}

func main() {
	lambda.Start(handler)
}
