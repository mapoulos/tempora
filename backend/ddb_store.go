package main

import (
	"errors"
	"fmt"

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
	GetMeditation(id string) (Meditation, error)
	DeleteMeditation(id string) error
	UpdateMeditation(m Meditation) error
}

type DynamoMeditationStore struct {
	sess      *session.Session
	svc       *dynamodb.DynamoDB
	tableName string
}

func NewDynamoMeditationStore(tableName string, config *aws.Config) DynamoMeditationStore {
	dynamoStore := DynamoMeditationStore{
		tableName: tableName,
	}
	dynamoStore.sess = session.Must(session.NewSession(config))
	dynamoStore.svc = dynamodb.New(dynamoStore.sess)

	return dynamoStore
}

func mapMeditationToMeditationRecord(m Meditation) MeditationRecord {
	pk := "med#" + m.ID
	sk := pk
	ppk := m.UserId
	pppk := "private"

	if m.Public {
		pppk = "public"
	}

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
		IndexName:              aws.String("gs2"),
		KeyConditionExpression: aws.String("ppk = :userId"),
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
		KeyConditionExpression: aws.String("pppk = :public"),
		IndexName:              aws.String("gs3"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":public": {
				S: aws.String("public"),
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

func (store DynamoMeditationStore) GetMeditation(id string) (Meditation, error) {
	m := Meditation{
		ID: id,
	}
	r := mapMeditationToMeditationRecord(m)
	params := &dynamodb.GetItemInput{
		TableName: aws.String(store.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"pk": {
				S: &r.Pk,
			},
			"sk": {
				S: &r.Sk,
			},
		},
	}

	resp, err := store.svc.GetItem(params)
	if err != nil {
		return Meditation{}, errors.New("Error with call to dynamodb on GetMeditation")
	}
	var meditationRecord MeditationRecord
	err = dynamodbattribute.UnmarshalMap(resp.Item, &meditationRecord)

	return meditationRecord.Meditation, nil
}

func (store DynamoMeditationStore) DeleteMeditation(id string) error {
	meditation, err := store.GetMeditation(id)
	if err != nil {
		return err
	}
	record := mapMeditationToMeditationRecord(meditation)
	params := &dynamodb.DeleteItemInput{
		TableName: aws.String(store.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"pk": {
				S: &record.Pk,
			},
			"sk": {
				S: &record.Sk,
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
	oldMeditation, err := store.GetMeditation(m.ID)
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
