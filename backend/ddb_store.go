package main

import (
	"errors"
	"fmt"
	"sync"

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

type SequenceRecord struct {
	Pk       string      `dynamodbav:"pk"`
	Sk       string      `dynamodbav:"sk"`
	Ppk      string      `dynamodbav:"ppk"`
	Pppk     string      `dynamodbav:"pppk"`
	Sequence SequenceDAO `dynamodbav:"seqDAO"`
}

type SequenceDAO struct {
	Sequence      Sequence `dynamodbav:"sequence"`
	MeditationIDs []string `dynamodbav:"meditationIds"`
}

type MeditationStore interface {
	SaveMeditation(m Meditation) error
	ListMeditations(userId string) ([]Meditation, error)
	ListPublicMeditations(userId string) ([]Meditation, error)
	GetMeditation(id string) (Meditation, error)
	DeleteMeditation(id string) error
	UpdateMeditation(m Meditation) error

	SaveSequence(s Sequence) error
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

func ternary(condition bool, ifTrue string, ifFalse string) string {
	if condition {
		return ifTrue
	}
	return ifFalse
}

func mapMeditationToMeditationRecord(m Meditation) MeditationRecord {
	pk := "med#" + m.ID
	sk := pk
	ppk := m.UserId
	pppk := ternary(m.Public, "public", "private")

	return MeditationRecord{
		Pk:         pk,
		Sk:         sk,
		Ppk:        ppk,
		Pppk:       pppk,
		Meditation: m,
	}
}

func mapSequenceToSequenceRecord(s Sequence) *SequenceRecord {
	pk := "seq#" + s.ID
	sk := pk
	ppk := s.UserId
	pppk := "private"

	meditationIDs := make([]string, len(s.Meditations))
	for i, m := range s.Meditations {
		meditationIDs[i] = m.ID
	}

	return &SequenceRecord{
		Pk:   pk,
		Sk:   sk,
		Ppk:  ppk,
		Pppk: pppk,
		Sequence: SequenceDAO{
			Sequence:      s,
			MeditationIDs: meditationIDs,
		},
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
		ScanIndexForward: aws.Bool(false),
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
		ScanIndexForward: aws.Bool(false),
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
		return Meditation{}, errors.New("error with call to dynamodb on getMeditation")
	}
	var meditationRecord MeditationRecord
	dynamodbattribute.UnmarshalMap(resp.Item, &meditationRecord)

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

	err = store.SaveMeditation(m)
	if err != nil {
		return err
	}
	return nil
}

func (store DynamoMeditationStore) SaveSequence(s Sequence) error {
	sequenceRecord := mapSequenceToSequenceRecord(s)
	sequenceItem, err := dynamodbattribute.MarshalMap(sequenceRecord)
	if err != nil {
		return err
	}
	params := &dynamodb.PutItemInput{
		TableName: &store.tableName,
		Item:      sequenceItem,
	}
	_, err = store.svc.PutItem(params)
	if err != nil {
		return err
	}
	return nil
}

func chunkMeditationIDs(meditationIDs []string) [][]string {
	MAX_CHUNK_SLICE := 100
	meditationIDCount := len(meditationIDs)
	chunks := len(meditationIDs) / MAX_CHUNK_SLICE
	if meditationIDCount%MAX_CHUNK_SLICE != 0 {
		chunks++
	}

	if chunks == 1 {
		return [][]string{meditationIDs}
	}

	batches := make([][]string, chunks)

	for i := range batches {
		batches[i] = make([]string, MAX_CHUNK_SLICE)
	}
	for i, id := range meditationIDs {
		batchesIdx := i % chunks
		subIdx := i / chunks
		batches[batchesIdx][subIdx] = id
	}
	return batches
}

func (store DynamoMeditationStore) GetMeditationsByIds(mIDs []string) ([]Meditation, error) {
	batchedMeditations := chunkMeditationIDs(mIDs)

	results := make([][]map[string]*dynamodb.AttributeValue, len(batchedMeditations))
	wg := sync.WaitGroup{}
	// probably should map this to a params list, to make cleaner. doing too much in this loop
	for batch, meditationIDs := range batchedMeditations {
		keys := make([]map[string]*dynamodb.AttributeValue, len(meditationIDs))
		for i, id := range meditationIDs {
			m := Meditation{
				ID: id,
			}
			r := mapMeditationToMeditationRecord(m)

			keys[i] = map[string]*dynamodb.AttributeValue{
				"pk": {
					S: &r.Pk,
				},
				"sk": {
					S: &r.Sk,
				},
			}
		}

		params := &dynamodb.BatchGetItemInput{
			RequestItems: map[string]*dynamodb.KeysAndAttributes{
				store.tableName: {
					Keys: keys,
				},
			},
		}

		wg.Add(1)
		go func(params *dynamodb.BatchGetItemInput, batchIdx int, wg *sync.WaitGroup) {
			resp, err := store.svc.BatchGetItem(params)
			if err != nil {
				results[batchIdx] = []map[string]*dynamodb.AttributeValue{}
			}
			r := resp.Responses[store.tableName]
			results[batchIdx] = r
			wg.Done()
		}(params, batch, &wg)

	}
	wg.Wait()
	meditations := []Meditation{}
	for _, responseBatch := range results {
		var meditationRecords []MeditationRecord
		err := dynamodbattribute.UnmarshalListOfMaps(responseBatch, &meditationRecords)
		if err != nil {
			return []Meditation{}, err
		}
		batchedMeditations := make([]Meditation, len(responseBatch))
		for i, r := range meditationRecords {
			batchedMeditations[i] = r.Meditation
		}
		meditations = append(meditations, batchedMeditations...)
	}

	return meditations, nil
}

func (store DynamoMeditationStore) GetSequenceById(sequenceId string) (Sequence, error) {
	// 1) get the sequence
	s := Sequence{
		ID: sequenceId,
	}
	r := mapSequenceToSequenceRecord(s)
	params := &dynamodb.GetItemInput{
		TableName: &store.tableName,
		Key: map[string]*dynamodb.AttributeValue{
			"pk": {
				S: &r.Pk,
			},
			"sk": {
				S: &r.Sk,
			},
		},
	}
	seqResp, err := store.svc.GetItem(params)
	if err != nil {
		return Sequence{}, err
	}

	// 2) unmarshal the response
	var sequenceRecord SequenceRecord
	err = dynamodbattribute.UnmarshalMap(seqResp.Item, &sequenceRecord)
	if err != nil {
		return Sequence{}, err
	}

	// 3) fetch all the meditations with Batch Get Item
	meditationIDs := sequenceRecord.Sequence.MeditationIDs
	meditations, err := store.GetMeditationsByIds(meditationIDs)
	if err != nil {
		return Sequence{}, err
	}
	if len(meditations) != len(meditationIDs) {
		return Sequence{}, errors.New("MeditationIDs in sequenceRecord do not have same length as those from GetMeditationsByIds")
	}

	// 4) make the order of the meditations match what we have in the record
	fetchedSequence := sequenceRecord.Sequence.Sequence
	sequenceOrder := make(map[string]int)
	for i, mID := range sequenceRecord.Sequence.MeditationIDs {
		sequenceOrder[mID] = i
	}
	reorderedMeditations := make([]Meditation, len(meditationIDs))
	for _, m := range meditations {
		newIdx := sequenceOrder[m.ID]
		reorderedMeditations[newIdx] = m
	}
	fetchedSequence.Meditations = reorderedMeditations
	return fetchedSequence, nil
}
