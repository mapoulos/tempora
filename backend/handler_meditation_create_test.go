package main

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/go-playground/validator/v10"
	uuid "github.com/satori/go.uuid"
	"github.com/segmentio/ksuid"
)

func createLocalBucket(bucketName string) error {
	// setup an s3 svc
	sess, _ := session.NewSession(awsConfig)
	svc := s3.New(sess)
	_, err := svc.CreateBucket(&s3.CreateBucketInput{
		Bucket: &bucketName,
	})

	if err != nil {
		fmt.Println("Couldn't create bucket")
		fmt.Println(err.Error())
		return err
	}
	return nil
}

func putFileInS3(localPath string, bucketName string, key string, config *aws.Config) error {
	sess, _ := session.NewSession(config)
	uploader := s3manager.NewUploader(sess)

	file, err := os.Open(localPath)
	if err != nil {
		return err
	}
	_, err = uploader.Upload(&s3manager.UploadInput{
		Bucket: &bucketName,
		Key:    &key,
		Body:   file,
	})

	if err != nil {
		return err
	}
	return nil
}

func TestHandlers(t *testing.T) {
	// create a bucket for testing
	awsConfig = getAwsConfig(true)
	bucketName := uuid.NewV4().String()
	createLocalBucket(bucketName)
	createLocalDynamoTable(bucketName)
	os.Setenv("AUDIO_BUCKET", bucketName)

	// stage a file for creation
	uploadKey := "upload/test-file"
	putFileInS3("../media/evagrius.onprayer.001.mp3", bucketName, uploadKey, awsConfig)

	// setup the database
	store := NewDynamoMeditationStore(bucketName, awsConfig)

	// initialize the validator
	validate = validator.New()
	validate.RegisterValidation("uploadKey", uploadKeyValidator)

	t.Run("Test Create and Get", func(t *testing.T) {
		input := CreateMeditationInput{
			UploadKey: uploadKey,
			Name:      "Test Meditaiton",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}
		jsonBytes, _ := json.Marshal(input)

		req := events.APIGatewayV2HTTPRequest{
			RequestContext: events.APIGatewayV2HTTPRequestContext{
				Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
					JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
						Claims: map[string]string{
							"sub": ksuid.New().String(),
						},
					},
				},
			},
			Body: string(jsonBytes),
		}
		fmt.Printf("%+v\n", req)
		resp := CreateMeditationHandler(req, &store)
		if resp.StatusCode != 201 {
			t.Errorf("Expected statusCode 201, got %d", resp.StatusCode)
			t.Errorf("%+v\n", resp)
		}
	})
}
