package main

import (
	"encoding/json"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	uuid "github.com/satori/go.uuid"
)

type UploadResponse struct {
	URL string
	Key string
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

func main() {

	lambda.Start(uploadHandler)
}
