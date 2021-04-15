package main

import (
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type MeditationRecord struct {
	Pk         string     `dynamodbav:"pk"`
	Sk         string     `dynamodbav:"sk"`
	Ppk        string     `dynamodbav:"ppk"`
	Pppk       string     `dynamodbav:"pppk"`
	Meditation Meditation `dynamodbav:"meditation"`
}

type MeditationStore interface {
	SaveMeditation(m Meditation) error
	ListMeditations(userId string) ([]Meditation, error)
	ListPublicMeditations(userId string) ([]Meditation, error)
	GetMeditation(userId string, id string) (Meditation, error)
	DeleteMeditation(userId string, id string) error
	UpdateMeditation(m Meditation) error
}

type DynamoMeditationStore struct {
	sess      *session.Session
	svc       *dynamodb.DynamoDB
	tableName string
}

func createDynamoTable(tableName string, svc *dynamodb.DynamoDB) {
	createTableParams := &dynamodb.CreateTableInput{
		TableName: aws.String(tableName),
		KeySchema: []*dynamodb.KeySchemaElement{
			{AttributeName: aws.String("pk"), KeyType: aws.String("HASH")},
			{AttributeName: aws.String("sk"), KeyType: aws.String("RANGE")},
		},
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			{AttributeName: aws.String("pk"), AttributeType: aws.String("S")},
			{AttributeName: aws.String("sk"), AttributeType: aws.String("S")},
			{AttributeName: aws.String("ppk"), AttributeType: aws.String("S")},
			{AttributeName: aws.String("pppk"), AttributeType: aws.String("S")},
		},
		BillingMode: aws.String(dynamodb.BillingModePayPerRequest),
		GlobalSecondaryIndexes: []*dynamodb.GlobalSecondaryIndex{
			{
				IndexName: aws.String("gs1"),
				KeySchema: []*dynamodb.KeySchemaElement{
					{AttributeName: aws.String("ppk"), KeyType: aws.String("HASH")},
				},
				Projection: &dynamodb.Projection{
					ProjectionType: aws.String(dynamodb.ProjectionTypeAll),
				},
			},
			{
				IndexName: aws.String("gs2"),
				KeySchema: []*dynamodb.KeySchemaElement{
					{AttributeName: aws.String("pppk"), KeyType: aws.String("HASH")},
					{AttributeName: aws.String("sk"), KeyType: aws.String("RANGE")},
				},
				Projection: &dynamodb.Projection{
					ProjectionType: aws.String(dynamodb.ProjectionTypeAll),
				},
			},
		},
	}

	_, err := svc.CreateTable(createTableParams)

	if err != nil {
		fmt.Println("Error in table creation")
		fmt.Println(err.Error())
	}
}

func NewDynamoMeditationStore(tableName string, local bool, createTable bool) DynamoMeditationStore {
	dynamoStore := DynamoMeditationStore{
		tableName: tableName,
	}

	environmentRegion := os.Getenv("AWS_REGION")
	defaultRegion := "us-east-1"
	var region string
	if environmentRegion != "" {
		region = environmentRegion
	} else {
		region = defaultRegion
	}

	if local {
		dynamoStore.sess = session.Must(session.NewSession(&aws.Config{
			Region:   aws.String(region),
			Endpoint: aws.String("http://127.0.0.1:9000"),
		}))
	} else {
		dynamoStore.sess = session.Must(session.NewSession(&aws.Config{
			Region:   aws.String(region),
			Endpoint: aws.String("https://dynamodb.us-east-1.amazonaws.com"),
		}))
	}
	dynamoStore.svc = dynamodb.New(dynamoStore.sess)

	tableExists, _ := dynamoStore.svc.DescribeTable(&dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	})

	if createTable && tableExists != nil && local {
		// TODO: move this to the test suite, since that's the only reason for it
		// really
		createDynamoTable(tableName, dynamoStore.svc)
	}

	return dynamoStore
}

func mapMeditationToMeditationRecord(m Meditation) MeditationRecord {
	pk := m.UserId
	sk := m.Name + "/" + m.ID
	ppk := m.ID
	pppk := strconv.FormatBool(m.Public)

	return MeditationRecord{
		Pk:         pk,
		Sk:         sk,
		Ppk:        ppk,
		Pppk:       pppk,
		Meditation: m,
	}
}

func (store DynamoMeditationStore) SaveMeditation(meditation Meditation) error {
	meditationRecord := mapMeditationToMeditationRecord(meditation)
	meditationAVMap, err := dynamodbattribute.MarshalMap(meditationRecord)
	if err != nil {
		return err
	}

	params := &dynamodb.PutItemInput{
		TableName: aws.String(store.tableName),
		Item:      meditationAVMap,
	}

	_, err = store.svc.PutItem(params)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (store DynamoMeditationStore) ListMeditations(userId string) ([]Meditation, error) {

	params := &dynamodb.QueryInput{
		TableName:              aws.String(store.tableName),
		KeyConditionExpression: aws.String("pk = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: aws.String(userId),
			},
		},
	}

	resp, err := store.svc.Query(params)
	if err != nil {
		fmt.Println(err)
		return []Meditation{}, err
	}

	var meditationRecords []MeditationRecord
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &meditationRecords)

	if err != nil {
		return []Meditation{}, err
	}

	meditations := make([]Meditation, len(meditationRecords))
	for i, m := range meditationRecords {
		meditations[i] = m.Meditation
	}

	return meditations, nil
}

func (store DynamoMeditationStore) ListPublicMeditations() ([]Meditation, error) {

	params := &dynamodb.QueryInput{
		TableName:              aws.String(store.tableName),
		KeyConditionExpression: aws.String("pppk = :isPublic"),
		IndexName:              aws.String("gs2"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":isPublic": {
				S: aws.String("true"),
			},
		},
	}

	resp, err := store.svc.Query(params)
	if err != nil {
		fmt.Println(err)
		return []Meditation{}, err
	}

	var meditationRecords []MeditationRecord
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &meditationRecords)

	if err != nil {
		return []Meditation{}, err
	}

	meditations := make([]Meditation, len(meditationRecords))
	for i, m := range meditationRecords {
		meditations[i] = m.Meditation
	}

	// meditations := []Meditation{}

	return meditations, nil
}

func (store DynamoMeditationStore) GetMeditation(userId string, id string) (Meditation, error) {
	params := &dynamodb.QueryInput{
		TableName:              aws.String(store.tableName),
		KeyConditionExpression: aws.String("ppk = :meditationId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":meditationId": {
				S: aws.String(id),
			},
		},
		IndexName: aws.String("gs1"),
	}

	resp, err := store.svc.Query(params)
	if err != nil {
		return Meditation{}, errors.New("Error with call to dynamodb on GetMeditation")
	}
	var meditationRecords []MeditationRecord
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &meditationRecords)
	respLen := len(meditationRecords)
	if respLen == 0 {
		return Meditation{}, errors.New("No meditation with ID " + id + " was found")
	}
	if respLen > 1 {
		return Meditation{}, errors.New("Multiple meditions with " + id + " were found!")
	}

	meditation := meditationRecords[0].Meditation
	return meditation, nil
}

func (store DynamoMeditationStore) DeleteMeditation(userId string, id string) error {
	meditation, err := store.GetMeditation(userId, id)
	if err != nil {
		return err
	}
	params := &dynamodb.DeleteItemInput{
		TableName: aws.String(store.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"pk": {
				S: aws.String(userId),
			},
			"sk": {
				S: aws.String(meditation.Name + "/" + meditation.ID),
			},
		},
	}
	_, err = store.svc.DeleteItem(params)
	if err != nil {
		return err
	}
	return nil
}

func (store DynamoMeditationStore) UpdateMeditation(m Meditation) error {
	oldMeditation, err := store.GetMeditation(m.UserId, m.ID)
	if err != nil {
		return err
	}

	if (Meditation{}) == oldMeditation {
		return errors.New("No meditation with " + m.ID + " found.")
	}

	if m.Name == oldMeditation.Name {
		err = store.SaveMeditation(m)
	} else {
		mAV := mapMeditationToMeditationRecord(m)

		newItem, err := dynamodbattribute.MarshalMap(mAV)

		if err != nil {
			fmt.Println(err.Error())
		}

		params := &dynamodb.TransactWriteItemsInput{
			TransactItems: []*dynamodb.TransactWriteItem{
				{
					Put: &dynamodb.Put{
						TableName: &store.tableName,
						Item:      newItem,
					},
				},
				{
					Delete: &dynamodb.Delete{
						TableName: &store.tableName,
						Key: map[string]*dynamodb.AttributeValue{
							"pk": {
								S: aws.String(oldMeditation.UserId),
							},
							"sk": {
								S: aws.String(oldMeditation.Name + "/" + oldMeditation.ID),
							},
						},
					},
				},
			},
		}
		store.svc.TransactWriteItems(params)

	}

	if err != nil {
		return err
	}

	return nil
}
