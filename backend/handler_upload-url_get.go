package main

import (
	"encoding/json"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	uuid "github.com/satori/go.uuid"
)

func getPresignedUrl(config *aws.Config) (string, string, error) {
	// setup an s3 svc
	sess, _ := session.NewSession(config)
	svc := s3.New(sess)

	// generate a presigned URL
	bucketName := os.Getenv("AUDIO_BUCKET")
	key := "upload/" + uuid.NewV4().String()
	s3req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	})
	url, err := s3req.Presign(15 * time.Minute)
	return key, url, err
}

func uploadHandler(req events.APIGatewayV2HTTPRequest) *events.APIGatewayV2HTTPResponse {
	// get the error
	key, url, err := getPresignedUrl(awsConfig)
	if err != nil {
		return internalServerError(err.Error())
	}

	// build the reponse
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
	return &resp
}
