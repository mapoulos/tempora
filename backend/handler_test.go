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

func handlerTestInit(bucketName string) string {
	// create a bucket for testing
	awsConfig = getAwsConfig(true)
	createLocalBucket(bucketName)

	os.Setenv("AUDIO_BUCKET", bucketName)

	// stage a file for creation
	uploadKey := "upload/test-file"
	putFileInS3("../media/evagrius.onprayer.001.mp3", bucketName, uploadKey, awsConfig)

	// initialize the validator
	validate = validator.New()
	validate.RegisterValidation("uploadKey", uploadKeyValidator)

	return uploadKey
}

func buildCreateMeditationRequest(userId string, input CreateMeditationInput) events.APIGatewayV2HTTPRequest {
	jsonBytes, _ := json.Marshal(input)

	return events.APIGatewayV2HTTPRequest{
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
				JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
					Claims: map[string]string{
						"sub": userId,
					},
				},
			},
		},
		Body: string(jsonBytes),
	}
}

func buildGetOrDeleteRequest(userId string, meditationId string) events.APIGatewayV2HTTPRequest {
	return events.APIGatewayV2HTTPRequest{
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
				JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
					Claims: map[string]string{
						"sub": userId,
					},
				},
			},
		},
		PathParameters: map[string]string{
			"meditationId": meditationId,
		},
	}
}

func buildUpdateRequest(userId string, meditationId string, input UpdateMeditationInput) events.APIGatewayV2HTTPRequest {
	jsonBytes, _ := json.Marshal(input)

	return events.APIGatewayV2HTTPRequest{
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
				JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
					Claims: map[string]string{
						"sub": userId,
					},
				},
			},
		},
		Body: string(jsonBytes),
		PathParameters: map[string]string{
			"meditationId": meditationId,
		},
	}
}

func TestHandlers(t *testing.T) {
	randomUuid := uuid.NewV4().String()
	bucketName := randomUuid
	uploadKey := handlerTestInit(bucketName)

	t.Run("Test CRUD happy flow", func(t *testing.T) {
		// create a database table for each test
		tableName := uuid.NewV4().String()
		createLocalDynamoTable(tableName)
		store := NewDynamoMeditationStore(tableName, awsConfig)

		// Create a meditation
		input := CreateMeditationInput{
			UploadKey: uploadKey,
			Name:      "Test Meditaiton",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}
		userId := "alex"
		createReq := buildCreateMeditationRequest(userId, input)

		createResp := CreateMeditationHandler(createReq, &store)
		if createResp.StatusCode != 201 {
			t.Errorf("Expected statusCode 201, got %d", createResp.StatusCode)
			t.Errorf("%+v\n", createResp)
		}
		createdMeditation := Meditation{}
		json.Unmarshal([]byte(createResp.Body), &createdMeditation)
		id := createdMeditation.ID

		// Verify we can get it
		getReq := buildGetOrDeleteRequest(userId, id)

		getResp := GetMeditationHandler(getReq, &store)
		if getResp.StatusCode != 200 {
			t.Errorf("Expected status code 200, got %d\n", getResp.StatusCode)
			t.Errorf("%+v\n", getResp)
		}

		// now lets update
		updateInput := UpdateMeditationInput{
			Name: "Test Meditation (changed)",
			Text: "Test Text (changed)",
		}
		updateRequest := buildUpdateRequest(userId, id, updateInput)
		updateResp := UpdateMeditationHandler(updateRequest, &store)
		if updateResp.StatusCode != 200 {
			t.Errorf("Expected status code 200, got %d\n", updateResp.StatusCode)
			t.Errorf("%+v\n", updateResp)
		}

		// now delete
		deleteRequest := getReq
		deleteResponse := DeleteMeditationHandler(deleteRequest, &store)
		if deleteResponse.StatusCode != 204 {
			t.Errorf("Expected status code 204, got %d\n", deleteResponse.StatusCode)
			t.Errorf("%+v\n", deleteResponse)
		}
	})

	t.Run("CREATE: Validation", func(t *testing.T) {
		// create a database table for each test
		tableName := uuid.NewV4().String()
		createLocalDynamoTable(tableName)
		store := NewDynamoMeditationStore(tableName, awsConfig)

		///////
		/// 1) try to create a meditation with a valid but non-existent upload-key
		///
		input := CreateMeditationInput{
			UploadKey: "upload/non-existent-upload-key",
			Name:      "Test Meditation",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}
		userId := "alex"
		createReq := buildCreateMeditationRequest(userId, input)
		createResp := CreateMeditationHandler(createReq, &store)
		if createResp.StatusCode != 400 {
			t.Errorf("Expected statusCode 400, got %d", createResp.StatusCode)
			t.Errorf("%+v\n", createResp)
		}

		///////
		/// 2) try to create a meditation a directory traversal
		///
		input2 := CreateMeditationInput{
			UploadKey: "upload/../../PATH_TRAVERSING_KEY",
			Name:      "Test Meditation",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}

		createReq2 := buildCreateMeditationRequest(userId, input2)
		createResp2 := CreateMeditationHandler(createReq2, &store)
		if createResp.StatusCode != 400 {
			t.Errorf("Expected statusCode 400, got %d", createResp2.StatusCode)
			t.Errorf("%+v\n", createResp2)
		}

		///////
		/// 3) try to create a meditation with empty Name
		///
		input3 := CreateMeditationInput{
			UploadKey: uploadKey,
			Name:      "",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}

		createReq3 := buildCreateMeditationRequest(userId, input3)
		createResp3 := CreateMeditationHandler(createReq3, &store)
		if createResp3.StatusCode != 400 {
			t.Errorf("Expected statusCode 400, got %d", createResp3.StatusCode)
			t.Errorf("%+v\n", createResp3)
		}

		///////
		/// 4) try to create a meditation with nonsense JSON
		///
		createReq4 := events.APIGatewayV2HTTPRequest{
			RequestContext: events.APIGatewayV2HTTPRequestContext{
				Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
					JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
						Claims: map[string]string{
							"sub": userId,
						},
					},
				},
			},
			Body: string("{this isn't even valid json yall}"),
		}

		createResp4 := CreateMeditationHandler(createReq4, &store)
		if createResp4.StatusCode != 400 {
			t.Errorf("Expected statusCode 400, got %d", createResp4.StatusCode)
			t.Errorf("%+v\n", createResp4)
		}

	})

	t.Run("GET: 404 scenarios", func(t *testing.T) {
		// create a database table for each test
		tableName := uuid.NewV4().String()
		createLocalDynamoTable(tableName)
		store := NewDynamoMeditationStore(tableName, awsConfig)
		userId := "alex"

		// Create a meditation
		input := CreateMeditationInput{
			UploadKey: uploadKey,
			Name:      "Test Meditaiton",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}

		createReq := buildCreateMeditationRequest(userId, input)
		createResp := CreateMeditationHandler(createReq, &store)
		if createResp.StatusCode != 201 {
			t.Errorf("Expected statusCode 201, got %d", createResp.StatusCode)
			t.Errorf("%+v\n", createResp)
		}
		createdMeditation := Meditation{}
		json.Unmarshal([]byte(createResp.Body), &createdMeditation)
		id := createdMeditation.ID

		// Verify a 404 for a different user
		getReq := buildGetOrDeleteRequest("maximus", id)
		getResp := GetMeditationHandler(getReq, &store)
		if getResp.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", getResp.StatusCode)
			t.Errorf("%+v\n", getResp)
		}

		// Verify a 404 for the right user, but a non existent ID
		getReqNonExistent := buildGetOrDeleteRequest(userId, "NON_EXISTENT_ID")
		getRespNonExistent := GetMeditationHandler(getReqNonExistent, &store)
		if getRespNonExistent.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", getRespNonExistent.StatusCode)
			t.Errorf("%+v\n", getRespNonExistent)
		}
	})

	t.Run("UPDATE/DELETE: 404 scenarios", func(t *testing.T) {
		// create a database table for each test
		tableName := uuid.NewV4().String()
		createLocalDynamoTable(tableName)
		store := NewDynamoMeditationStore(tableName, awsConfig)
		userId := "alex"

		// Create a meditation
		input := CreateMeditationInput{
			UploadKey: uploadKey,
			Name:      "Test Meditaiton",
			Text:      "Arma virumque cano Troiae qui primus ab oris\nItaliam fato profugus...",
			Public:    false,
		}

		createReq := buildCreateMeditationRequest(userId, input)
		createResp := CreateMeditationHandler(createReq, &store)
		if createResp.StatusCode != 201 {
			t.Errorf("Expected statusCode 201, got %d", createResp.StatusCode)
			t.Errorf("%+v\n", createResp)
		}
		createdMeditation := Meditation{}
		json.Unmarshal([]byte(createResp.Body), &createdMeditation)
		id := createdMeditation.ID

		if id == "" {
			t.Errorf("No ID found on returned meditation")
			t.Errorf("%+v", createResp)
		}

		///////////
		//// Deletes
		///
		// Verify a 404 for a different user
		deleteRequest := buildGetOrDeleteRequest("maximus", id)
		deleteResponse := DeleteMeditationHandler(deleteRequest, &store)
		if deleteResponse.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", deleteResponse.StatusCode)
			t.Errorf("%+v\n", deleteResponse)
		}

		// Verify a 404 for the right user, but a non existent ID
		deleteRequestNonExistent := buildGetOrDeleteRequest(userId, "THIS_ID_DOES_NOT_EXIST")
		deleteResponseNonExistent := DeleteMeditationHandler(deleteRequestNonExistent, &store)
		if deleteResponseNonExistent.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", deleteResponseNonExistent.StatusCode)
			t.Errorf("%+v\n", deleteResponseNonExistent)
		}

		///////////
		//// Update
		///
		// first ensure that user checking works
		updateInput := UpdateMeditationInput{
			Name: "Test Meditation (changed)",
			Text: "Test Text (changed)",
		}

		updateRequest := buildUpdateRequest("WRONG_USER", id, updateInput)
		updateResp := UpdateMeditationHandler(updateRequest, &store)
		if updateResp.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", updateResp.StatusCode)
			t.Errorf("%+v\n", updateResp)
		}

		/// now ensure that we won't update a non-existent record
		updateRequestNonExistent := buildUpdateRequest(userId, "NON_EXISTENT_ID", updateInput)
		updateResponseNonExistent := UpdateMeditationHandler(updateRequestNonExistent, &store)
		if updateResponseNonExistent.StatusCode != 404 {
			t.Errorf("Expected status code 404, got %d\n", updateResponseNonExistent.StatusCode)
			t.Errorf("%+v\n", updateResponseNonExistent)
		}
	})
}
