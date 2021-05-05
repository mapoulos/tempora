package main

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type MeditationRecord struct {
	Pk         string     `dynamodbav:"pk"`
	Sk         string     `dynamodbav:"sk"`
	Ppk        string     `dynamodbav:"ppk"`
	Pppk       string     `dynamodbav:"pppk,omitempty"`
	Type       string     `dynamodbav:"type"`
	UpdatedAt  string     `dynamodbav:"lastUpdated"`
	Meditation Meditation `dynamodbav:"meditation"`
}

type SequenceRecord struct {
	Pk        string      `dynamodbav:"pk"`
	Sk        string      `dynamodbav:"sk"`
	Ppk       string      `dynamodbav:"ppk"`
	Pppk      string      `dynamodbav:"pppk,omitempty"`
	Type      string      `dynamodbav:"type"`
	UpdatedAt string      `dynamodbav:"lastUpdated"`
	Sequence  SequenceDAO `dynamodbav:"seqDAO"`
}

type MeditationSequenceRelationRecord struct {
	Pk string `dynamodbav:"pk"`
	Sk string `dynamodbav:"sk"`
	// Ppk       string `dynamodbav:"ppk"`
	// Pppk      string `dynamodbav:"pppk"`
	Type      string `dynamodbav:"type"`
	UpdatedAt string `dynamodbav:"lastUpdated"`
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

func mapMeditationToMeditationRecord(m Meditation) *MeditationRecord {
	pk := "med#" + m.ID
	sk := pk
	ppk := m.UserId
	pppk := ternary(m.Public, "public", "private")
	updatedAt := time.Now().UTC().Format(time.RFC3339)

	return &MeditationRecord{
		Pk:         pk,
		Sk:         sk,
		Ppk:        ppk,
		Pppk:       pppk,
		Type:       "med",
		UpdatedAt:  updatedAt,
		Meditation: m,
	}
}

func mapSequenceToSequenceRecord(s Sequence) *SequenceRecord {
	pk := "seq#" + s.ID
	sk := pk
	ppk := s.UserId
	pppk := ternary(s.Public, "public-seq", "")

	updatedAt := time.Now().UTC().Format(time.RFC3339)

	meditationIDs := make([]string, len(s.Meditations))
	for i, m := range s.Meditations {
		meditationIDs[i] = m.ID
	}

	return &SequenceRecord{
		Pk:        pk,
		Sk:        sk,
		Ppk:       ppk,
		Pppk:      pppk,
		Type:      "seq",
		UpdatedAt: updatedAt,
		Sequence: SequenceDAO{
			Sequence:      s,
			MeditationIDs: meditationIDs,
		},
	}
}

func mapMeditationAndSequenceToMeditationAndSequenceRelationRecord(m Meditation, s Sequence) *MeditationSequenceRelationRecord {
	pk := "med#" + m.ID
	sk := "seq#" + s.ID
	updatedAt := time.Now().UTC().Format(time.RFC3339)

	return &MeditationSequenceRelationRecord{
		Pk:        pk,
		Sk:        sk,
		Type:      "medseqrln",
		UpdatedAt: updatedAt,
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
		// ConditionExpression: aws.String("attribute_not_exists(#pk)"),
		// ExpressionAttributeNames: map[string]*string{
		// "#pk": aws.String("pk"),
		// },
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
	// 1) check if this is part of a sequence. if it is, return an error
	sequenceIds, err := store.GetSequenceIdsByMeditationId(id)
	if err != nil {
		return err
	}
	if len(sequenceIds) > 0 {
		return fmt.Errorf("cannot delete meditation while it is still part of %d sequence(s)", len(sequenceIds))
	}

	// 2) proceed with the deletion
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
	if err != nil {
		return err
	}

	record := mapMeditationToMeditationRecord(m)
	meditationAVmap, _ := dynamodbattribute.MarshalMap(record)
	params := &dynamodb.PutItemInput{
		TableName:           aws.String(store.tableName),
		Item:                meditationAVmap,
		ConditionExpression: aws.String("#lastUpdated <= :lastUpdated"),
		ExpressionAttributeNames: map[string]*string{
			// "#pk":          aws.String("pk"),
			"#lastUpdated": aws.String("lastUpdated"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":lastUpdated": {
				S: &record.UpdatedAt,
			},
		},
	}

	_, err = store.svc.PutItem(params)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (store DynamoMeditationStore) SaveSequence(s Sequence) error {
	// 1) save the sequence record
	sequenceRecord := mapSequenceToSequenceRecord(s)
	sequenceItem, err := dynamodbattribute.MarshalMap(sequenceRecord)
	if err != nil {
		return err
	}
	params := &dynamodb.PutItemInput{
		TableName:           &store.tableName,
		Item:                sequenceItem,
		ConditionExpression: aws.String("attribute_not_exists(#pk)"),
		ExpressionAttributeNames: map[string]*string{
			"#pk": aws.String("pk"),
		},
	}
	_, err = store.svc.PutItem(params)
	if err != nil {
		return err
	}

	// 2) save the relation records
	err = store.updateSequenceMeditationRelationRecords(sequenceRecord)
	if err != nil {
		return err
	}
	return nil
}

func (store DynamoMeditationStore) updateSequenceMeditationRelationRecords(seqRec *SequenceRecord) error {
	// 1) delete all existing relation records
	existingRelationRecordsQuery := &dynamodb.QueryInput{
		TableName:              &store.tableName,
		IndexName:              aws.String("gs1"),
		KeyConditionExpression: aws.String("#sk = :sk and begins_with(#pk, :med)"),
		ExpressionAttributeNames: map[string]*string{
			"#sk": aws.String("sk"),
			"#pk": aws.String("pk"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":sk": {
				S: &seqRec.Pk,
			},
			":med": {
				S: aws.String("med#"),
			},
		},
		Limit: aws.Int64(200),
	}
	//we don't need paging b/c 200 meditations shouldn't amount to 1mb of data
	resp, err := store.svc.Query(existingRelationRecordsQuery)
	if err != nil {
		return err
	}
	// TODO: batch this
	wg0 := sync.WaitGroup{}
	deleteErrors := make([]error, len(resp.Items))
	for idx, item := range resp.Items {
		deleteRequest := &dynamodb.DeleteItemInput{
			TableName: &store.tableName,
			Key: map[string]*dynamodb.AttributeValue{
				"pk": item["pk"],
				"sk": item["sk"],
			},
			ReturnValues: aws.String(dynamodb.ReturnValueAllOld),
		}
		wg0.Add(1)
		go func(deleteReq *dynamodb.DeleteItemInput, errIdx int, wg *sync.WaitGroup) {
			defer wg.Done()
			_, err := store.svc.DeleteItem(deleteReq)
			if err != nil {
				deleteErrors[errIdx] = err
				return
			}
			deleteErrors[errIdx] = nil
		}(deleteRequest, idx, &wg0)
	}
	wg0.Wait()
	for _, err := range deleteErrors {
		if err != nil {
			return err
		}
	}

	// 2) create the writeRequests for the new relation records
	MAX_BATCH_WRITE_ITEM_SIZE := 25
	batchedMeditationIds := chunkMeditationIDs(seqRec.Sequence.MeditationIDs, MAX_BATCH_WRITE_ITEM_SIZE)
	batchWriteItemParamSlice := make([]*dynamodb.BatchWriteItemInput, len(batchedMeditationIds))
	for batchIdx, meditationIds := range batchedMeditationIds {
		items := make([]*dynamodb.WriteRequest, len(meditationIds))
		for j, mID := range meditationIds {
			m := Meditation{
				ID: mID,
			}
			relationRecord := mapMeditationAndSequenceToMeditationAndSequenceRelationRecord(m, seqRec.Sequence.Sequence)
			item, _ := dynamodbattribute.MarshalMap(relationRecord)
			items[j] = &dynamodb.WriteRequest{
				PutRequest: &dynamodb.PutRequest{
					Item: item,
				},
			}
		}

		batchWriteItemParamSlice[batchIdx] = &dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]*dynamodb.WriteRequest{
				store.tableName: items,
			},
		}
	}

	// 3) write the relation records in parallel
	wg1 := sync.WaitGroup{}
	errs := make([]error, len(batchedMeditationIds))
	for batchIdx, params := range batchWriteItemParamSlice {
		wg1.Add(1)
		go func(params *dynamodb.BatchWriteItemInput, idx int, wg *sync.WaitGroup) {
			defer wg.Done()
			_, err := store.svc.BatchWriteItem(params)
			if err != nil {
				errs[idx] = err
				return
			}
			errs[idx] = nil
		}(params, batchIdx, &wg1)
	}
	wg1.Wait()
	for _, err := range errs {
		if err != nil {
			return err
		}
	}
	return nil

}

func (store DynamoMeditationStore) GetSequenceIdsByMeditationId(meditationId string) ([]string, error) {
	m := Meditation{
		ID: meditationId,
	}
	pk := mapMeditationToMeditationRecord(m).Pk

	sequencesForMeditationQuery := &dynamodb.QueryInput{
		TableName:              &store.tableName,
		KeyConditionExpression: aws.String("#pk = :pk and begins_with(#sk, :seq)"),
		// KeyConditionExpression: aws.String("#pk = :pk"),
		ExpressionAttributeNames: map[string]*string{
			"#pk": aws.String("pk"),
			"#sk": aws.String("sk"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {
				S: &pk,
			},
			":seq": {
				S: aws.String("seq#"),
			},
		},
		Limit: aws.Int64(200),
	}
	resp, err := store.svc.Query(sequencesForMeditationQuery)
	if err != nil {
		return []string{}, err
	}
	if *resp.Count == 0 {
		return []string{}, nil
	}
	sequenceIds := make([]string, *resp.Count)
	for i, item := range resp.Items {
		sequenceRecord := SequenceRecord{}
		dynamodbattribute.UnmarshalMap(item, &sequenceRecord)
		sequenceIds[i] = sequenceRecord.Sequence.Sequence.ID
	}
	return sequenceIds, nil
}

func (store DynamoMeditationStore) UpdateSequence(s Sequence) error {
	sequenceRecord := mapSequenceToSequenceRecord(s)
	sequenceItem, err := dynamodbattribute.MarshalMap(sequenceRecord)
	if err != nil {
		return err
	}
	params := &dynamodb.PutItemInput{
		TableName:           &store.tableName,
		Item:                sequenceItem,
		ConditionExpression: aws.String("attribute_exists(#pk) AND #lastUpdated <= :lastUpdated"),
		ExpressionAttributeNames: map[string]*string{
			"#pk":          aws.String("pk"),
			"#lastUpdated": aws.String("lastUpdated"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":lastUpdated": {
				S: &sequenceRecord.UpdatedAt,
			},
		},
	}
	_, err = store.svc.PutItem(params)
	if err != nil {
		return err
	}

	store.updateSequenceMeditationRelationRecords(sequenceRecord)
	return nil
}

func (store DynamoMeditationStore) DeleteSequenceById(sequenceId string) error {

	sequenceRecord := mapSequenceToSequenceRecord(Sequence{
		ID:          sequenceId,
		Meditations: []Meditation{},
	})

	store.updateSequenceMeditationRelationRecords(sequenceRecord)

	params := &dynamodb.DeleteItemInput{
		TableName: &store.tableName,
		Key: map[string]*dynamodb.AttributeValue{
			"pk": {
				S: &sequenceRecord.Pk,
			},
			"sk": {
				S: &sequenceRecord.Sk,
			},
		},
	}
	_, err := store.svc.DeleteItem(params)

	if err != nil {
		return err
	}
	return nil
}

func (store DynamoMeditationStore) ListSequencesByUserId(userId string) ([]Sequence, error) {
	listSeqQuery := &dynamodb.QueryInput{
		TableName:              &store.tableName,
		KeyConditionExpression: aws.String("#ppk = :userId and begins_with(#sk, :seq)"),
		IndexName:              aws.String("gs2"),
		ExpressionAttributeNames: map[string]*string{
			"#ppk": aws.String("ppk"),
			"#sk":  aws.String("sk"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: &userId,
			},
			":seq": {
				S: aws.String("seq#"),
			},
		},
	}
	resp, err := store.svc.Query(listSeqQuery)
	if err != nil {
		return []Sequence{}, err
	}
	seqRecs := make([]SequenceRecord, *resp.Count)
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &seqRecs)
	if err != nil {
		return []Sequence{}, err
	}

	seqs := make([]Sequence, len(seqRecs))

	for i, r := range seqRecs {
		seqs[i] = r.Sequence.Sequence
	}

	return seqs, nil
}

func (store DynamoMeditationStore) ListPublicSequences() ([]Sequence, error) {
	listSeqQuery := &dynamodb.QueryInput{
		TableName:              &store.tableName,
		KeyConditionExpression: aws.String("#pppk = :public"),
		IndexName:              aws.String("gs3"),
		ExpressionAttributeNames: map[string]*string{
			"#pppk": aws.String("pppk"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":public": {
				S: aws.String("public-seq"),
			},
		},
	}
	resp, err := store.svc.Query(listSeqQuery)
	if err != nil {
		return []Sequence{}, err
	}
	seqRecs := make([]SequenceRecord, *resp.Count)
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &seqRecs)
	if err != nil {
		return []Sequence{}, err
	}

	seqs := make([]Sequence, len(seqRecs))

	for i, r := range seqRecs {
		seqs[i] = r.Sequence.Sequence
	}

	return seqs, nil
}

func chunkMeditationIDs(meditationIDs []string, chunkSize int) [][]string {
	MAX_CHUNK_SLICE := chunkSize
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
	// 1) split the meditationIDs into chunks of 100
	MAX_BATCH_GET_ITEMS_SIZE := 100
	batchedMeditations := chunkMeditationIDs(mIDs, MAX_BATCH_GET_ITEMS_SIZE)

	// 2) build and collect the batchGetItem requests into a slice
	batchCount := len(batchedMeditations)
	params := make([]*dynamodb.BatchGetItemInput, batchCount)
	for batchIdx, meditationIDs := range batchedMeditations {
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

		params[batchIdx] = &dynamodb.BatchGetItemInput{
			RequestItems: map[string]*dynamodb.KeysAndAttributes{
				store.tableName: {
					Keys: keys,
				},
			},
		}
	}

	// 3) issue the BatchGetItem requests in parallel
	results := make([][]map[string]*dynamodb.AttributeValue, batchCount)
	wg := sync.WaitGroup{}
	for batchIdx, getItemParams := range params {
		wg.Add(1)
		go func(params *dynamodb.BatchGetItemInput, batchIdx int, wg *sync.WaitGroup) {
			resp, err := store.svc.BatchGetItem(params)
			if err != nil {
				results[batchIdx] = []map[string]*dynamodb.AttributeValue{}
			}
			r := resp.Responses[store.tableName]
			results[batchIdx] = r
			wg.Done()
		}(getItemParams, batchIdx, &wg)
	}
	wg.Wait()

	// 4) unmarshal the records into sequences
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
	if seqResp.Item == nil {
		return Sequence{}, errors.New("no sequence found for id " + sequenceId)
	}

	// 2) unmarshal the response
	var sequenceRecord SequenceRecord
	err = dynamodbattribute.UnmarshalMap(seqResp.Item, &sequenceRecord)
	if err != nil {
		return Sequence{}, err
	}

	// 3) inflate the list of meditations
	meditationIDs := sequenceRecord.Sequence.MeditationIDs
	meditations, err := store.GetMeditationsByIds(meditationIDs)
	if err != nil {
		return Sequence{}, err
	}

	// 4) make the order of the meditations match what we have in the record
	fetchedSequence := sequenceRecord.Sequence.Sequence
	idToMedMap := make(map[string]Meditation)
	for _, m := range meditations {
		idToMedMap[m.ID] = m
	}
	reorderedMeditations := make([]Meditation, len(meditationIDs))
	for i, m := range meditationIDs {
		meditation := idToMedMap[m]
		reorderedMeditations[i] = meditation
	}
	fetchedSequence.Meditations = reorderedMeditations
	return fetchedSequence, nil
}
