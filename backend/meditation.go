package main

import (
	"errors"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

var awsConfig *aws.Config

func getAwsConfig(local bool) *aws.Config {
	config := aws.Config{
		Region: aws.String(getRegion()),
	}
	if local {
		config.Endpoint = aws.String("http://localhost:4566")
		config.S3ForcePathStyle = aws.Bool(true)
	}
	return &config
}

func handler(req events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	store := NewDynamoMeditationStore(os.Getenv("DDB_TABLE"), awsConfig)

	// 0) miscellaneous
	switch req.RequestContext.HTTP.Path {
	case "/upload-url":
		return uploadHandler(req), nil
	case "/public/meditations":
		return ListPublicMeditationsHandler(req, &store), nil

	}

	// 1) sequences
	if strings.HasPrefix(req.RequestContext.HTTP.Path, "/sequences") {
		switch req.RequestContext.HTTP.Method {
		case "GET":
			if _, ok := req.PathParameters["sequenceId"]; ok {
				return nil, errors.New("not yet implemented /sequences/:seqId")
			}
			return ListSequenceHandler(req, &store), nil
		case "POST":
			return CreateSequenceHandler(req, &store), nil
		}
	}

	if strings.HasPrefix(req.RequestContext.HTTP.Path, "/public/sequences") {
		if _, ok := req.PathParameters["sequenceId"]; ok {
			return GetPublicSequenceByIdHandler(req, &store), nil
		}
		return ListPublicSequencesHandler(req, &store), nil
	}

	// 2) meditations
	switch req.RequestContext.HTTP.Method {
	case "GET":
		if _, ok := req.PathParameters["meditationId"]; ok {
			// a get by medition id
			return GetMeditationHandler(req, &store), nil
		}
		// a listMeditations
		return ListMeditationHandler(req, &store), nil
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
	awsConfig = getAwsConfig(false)

	lambda.Start(handler)
}
