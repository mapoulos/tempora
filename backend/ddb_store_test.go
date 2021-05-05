package main

import (
	"fmt"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/go-test/deep"
	uuid "github.com/satori/go.uuid"
	"github.com/segmentio/ksuid"
)

func createLocalDynamoTable(tableName string) {
	sess := session.Must(session.NewSession(getAwsConfig(true)))

	svc := dynamodb.New(sess)

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
					{AttributeName: aws.String("sk"), KeyType: aws.String("HASH")},
					{AttributeName: aws.String("pk"), KeyType: aws.String("RANGE")},
				},
				Projection: &dynamodb.Projection{
					ProjectionType: aws.String(dynamodb.ProjectionTypeAll),
				},
			},
			{
				IndexName: aws.String("gs2"),
				KeySchema: []*dynamodb.KeySchemaElement{
					{AttributeName: aws.String("ppk"), KeyType: aws.String("HASH")},
					{AttributeName: aws.String("sk"), KeyType: aws.String("RANGE")},
				},
				Projection: &dynamodb.Projection{
					ProjectionType: aws.String(dynamodb.ProjectionTypeAll),
				},
			},
			{
				IndexName: aws.String("gs3"),
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

func contains(meditations []Meditation, meditationToFind Meditation) bool {
	var match Meditation
	for _, m := range meditations {
		if m == meditationToFind {
			match = m
		}
	}
	return match != Meditation{}
}

func initializeTestingStore(tableName string) *DynamoMeditationStore {
	createLocalDynamoTable(tableName)
	store := NewDynamoMeditationStore(tableName, getAwsConfig(true))
	return &store
}

func TestDynamoMeditationStore(t *testing.T) {

	t.Run("Test DynamoStore SaveMeditation", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		m := Meditation{
			UserId: "alex",
			ID:     uuid.NewV4().String(),
			Name:   "Test Meditation",
			Public: false,
		}

		err := store.SaveMeditation(m)
		if err != nil {
			println(err.Error())
			t.Error("SaveMeditation failed")
		}
	})

	t.Run("Test DynamoStore SaveMeditation and Get", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		uuid := uuid.NewV4().String()
		userId := "alex"
		m := Meditation{
			UserId: userId,
			ID:     uuid,
			Name:   "Test Meditation",
			Public: false,
		}

		store.SaveMeditation(m)

		m2, err := store.GetMeditation(uuid)
		if err != nil {
			t.Error("SaveMeditation and GetMeditation failed")
		}
		if m2 != m {
			t.Errorf("Expected \n%+v \n\nGot\n %+v", m, m2)
		}
	})

	t.Run("Test Multiple Creates and List", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		userId := "alex"
		numMeditations := 10
		for i := 0; i < numMeditations; i++ {
			store.SaveMeditation(Meditation{
				UserId: userId,
				Name:   "Meditation " + strconv.Itoa(i),
				ID:     strconv.Itoa(i),
				Public: false,
			})
		}
		meditations, err := store.ListMeditations(userId)
		if err != nil {
			t.Error("ListMeditations failed")
		}
		if len(meditations) != numMeditations {
			t.Errorf("Expected %d meditations. Found %d meditations", numMeditations, len(meditations))
		}
	})

	t.Run("Test Updates", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		userId := "alex"

		numMeditations := 3
		for i := 0; i < numMeditations; i++ {
			store.SaveMeditation(Meditation{
				UserId: userId,
				Name:   "Meditation " + strconv.Itoa(i),
				ID:     strconv.Itoa(i),
				Public: false,
			})
		}

		m, err := store.GetMeditation("0")
		if err != nil {
			t.Error("Did not find meditation with ID 0")
		}
		m.Name = "Changed"
		store.UpdateMeditation(m)

		meditations, err := store.ListMeditations(userId)
		if err != nil {
			t.Error("Couldn't list medtations for userId " + userId)
		}
		if len(meditations) != numMeditations {
			fmt.Println(meditations)
			t.Errorf("Found %d meditations, Expected %d meditations", len(meditations), numMeditations)
		}
		if !contains(meditations, m) {
			fmt.Println(meditations)
			t.Errorf("Could not find meditation after updating it")
		}
	})

	t.Run("Test Meditation Delete", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		userId := "alex"

		numMeditations := 3
		for i := 0; i < numMeditations; i++ {
			store.SaveMeditation(Meditation{
				UserId: userId,
				Name:   "Meditation " + strconv.Itoa(i),
				ID:     strconv.Itoa(i),
				Public: false,
			})
		}

		m, err := store.GetMeditation("0")
		if err != nil {
			t.Error("Did not find meditation with ID 0")
		}
		err = store.DeleteMeditation("0")
		if err != nil {
			t.Error(err.Error())
		}

		meditations, err := store.ListMeditations(userId)
		if err != nil {
			t.Error("Couldn't list medtations for userId " + userId)
		}
		if len(meditations) != numMeditations-1 {
			t.Errorf("Found %d meditations, Expected %d meditations", len(meditations), numMeditations-1)
		}
		if contains(meditations, m) {
			t.Errorf("Found meditation after deleting it!")
		}
	})

	t.Run("Test Public Meditations", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)

		users := []string{"gregory", "alexandria", "maximus"}

		numMeditations := 3
		for _, user := range users {
			for i := 0; i < numMeditations; i++ {
				store.SaveMeditation(Meditation{
					UserId: user,
					Name:   "Meditation Private " + strconv.Itoa(i),
					ID:     uuid.NewV4().String(),
					Public: false,
				})
				store.SaveMeditation(Meditation{
					UserId: user,
					Name:   "Meditation Public " + strconv.Itoa(i),
					ID:     uuid.NewV4().String(),
					Public: true,
				})
			}
		}

		expectedPublicMeditations := len(users) * numMeditations
		publicMeditations, err := store.ListPublicMeditations()

		if err != nil {
			t.Error("Problem listing public meditations")
			t.Error(err.Error())
		}
		if len(publicMeditations) != expectedPublicMeditations {
			t.Errorf("Expected %d meditations, got %d meditations", expectedPublicMeditations, len(publicMeditations))
		}

	})
}

func TestChunker(t *testing.T) {
	strCount := 1000
	strs := make([]string, strCount)
	for i := 0; i < strCount; i++ {
		strs[i] = strconv.Itoa(i)
	}
	batches := chunkMeditationIDs(strs, 100)
	if len(batches) != 10 {
		t.Errorf("Expected %d batches got %d", 10, len(batches))
	}
	if len(batches[2]) >= 101 {
		t.Errorf("Batcher failed, expected len(batches[0]) <= 100, but got %d", len(batches[0]))
	}
}

func createMeditations(count int, userId string, store *DynamoMeditationStore) []Meditation {
	now := time.Now()

	meditations := make([]Meditation, count)
	ids := make([]string, count)
	wg := sync.WaitGroup{}
	for i := 0; i < count; i++ {
		id := "seqMed" + strconv.Itoa(i)
		ids[i] = id
		m := Meditation{
			ID:        id,
			Name:      fmt.Sprintf("Meditation %d", i),
			Text:      "Meditation Text",
			URL:       "http://mp3.com/1.mp3",
			Public:    false,
			UserId:    userId,
			CreatedAt: now,
			UpdatedAt: now,
		}
		meditations[i] = m

	}

	for _, m := range meditations {
		wg.Add(1)
		go func(m Meditation, wg *sync.WaitGroup) {
			store.SaveMeditation(m)
			wg.Done()
		}(m, &wg)
	}
	wg.Wait()
	return meditations
}

func TestSequences(t *testing.T) {

	t.Run("Create a sequence, get a sequence, update a sequence, delete a sequence", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)
		now := time.Now()
		userId := "alex"

		meditations := createMeditations(10, "alex", store)
		mCount := len(meditations)

		sequenceId := ksuid.New().String()
		sequence := Sequence{
			ID:          sequenceId,
			Name:        "Sequence 1",
			Description: "A Testing Sequence",
			ImageURL:    "https://image.url/",
			Public:      false,
			UserId:      userId,
			CreatedAt:   now,
			UpdatedAt:   now,
			Meditations: meditations,
		}
		err := store.SaveSequence(sequence)
		if err != nil {
			t.Error(err.Error())
		}

		fetchedSequence, err := store.GetSequenceById(sequenceId)
		if err != nil {
			t.Error(err.Error())
		}
		if diff := deep.Equal(sequence, fetchedSequence); diff != nil {
			t.Error(diff)
			return
		}
		expectedId := sequence.Meditations[0].ID
		actualId := fetchedSequence.Meditations[0].ID
		if expectedId != actualId {
			t.Errorf("First meditations don't match.")
			t.Errorf("expected %s got %s", expectedId, actualId)
			t.Errorf("%+v", len(fetchedSequence.Meditations))
		}
		if diff := deep.Equal(sequence, fetchedSequence); diff != nil {
			t.Error("Expected fetchedSequence to match original sequence")
			t.Error(diff)
		}

		// update the sequence
		updatedSequence := sequence
		updatedSequence.Meditations = meditations[0 : mCount/2]
		err = store.UpdateSequence(updatedSequence)
		if err != nil {
			t.Error(err)
		}

		updatedFetchedSequence, _ := store.GetSequenceById(sequenceId)
		if len(updatedFetchedSequence.Meditations) != mCount/2 {
			t.Errorf("did not find 100 updated meditations: %d", len(updatedFetchedSequence.Meditations))
		}

		// delete the sequence
		err = store.DeleteSequenceById(sequenceId)
		if err != nil {
			t.Error("deletion failed")
			t.Error(err.Error())
		}
	})

	t.Run("Get a nonexistent sequence fails", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)
		_, err := store.GetSequenceById("DOES_NOT_EXIST")
		if err == nil {
			t.Error("expected an error for non-existent get, but got nil")
		}
	})

	t.Run("Disallow deletion of meditation if it's in a sequence", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)
		now := time.Now()
		userId := "alex"

		meditations := createMeditations(3, "alex", store)
		sequenceId := ksuid.New().String()
		sequence := Sequence{
			ID:          sequenceId,
			Name:        "Sequence 1",
			Description: "A Testing Sequence",
			ImageURL:    "https://image.url/",
			Public:      false,
			UserId:      userId,
			CreatedAt:   now,
			UpdatedAt:   now,
			Meditations: meditations,
		}
		err := store.SaveSequence(sequence)
		if err != nil {
			t.Error(err.Error())
		}

		m := meditations[0]
		err = store.DeleteMeditation(m.ID)
		if err == nil {
			t.Error("should not have allowed meditation to be deleted because it is part of a sequence!")
		}
		updatedSequence := sequence
		updatedSequence.Meditations = meditations[1:]
		err = store.UpdateSequence(updatedSequence)
		if err != nil {
			t.Error(err.Error())
		}
		err = store.DeleteMeditation(m.ID)
		if err != nil {
			t.Error(err.Error())
		}

	})

	t.Run("List meditations happy path", func(t *testing.T) {
		localUserId := ksuid.New().String()
		tableName := uuid.NewV4().String()
		store := initializeTestingStore(tableName)
		now := time.Now()

		meditations := createMeditations(15, localUserId, store)
		numSeqs := 3
		for i := 0; i < numSeqs; i++ {
			err := store.SaveSequence(Sequence{
				ID:          "seq-" + strconv.Itoa(i),
				Name:        "Sequence " + strconv.Itoa(i),
				Description: "A Testing Sequence",
				ImageURL:    "https://image.url/",
				Public:      false,
				UserId:      localUserId,
				CreatedAt:   now,
				UpdatedAt:   now,
				Meditations: meditations[i*5 : i*5+5],
			})
			if err != nil {
				t.Error(err.Error())
			}
		}
		retrievedSeqs, err := store.ListSequencesByUserId(localUserId)
		if err != nil {
			t.Error(err.Error())
		}
		expectedLen := numSeqs
		actualLen := len(retrievedSeqs)
		if expectedLen != actualLen {
			t.Errorf("Expected %d sequences, but got %d sequences", expectedLen, actualLen)
		}
	})

}

func BenchmarkGetMeditationsByIds(b *testing.B) {
	tableName := uuid.NewV4().String()
	store := initializeTestingStore(tableName)
	now := time.Now()
	userId := "alex"

	mCount := 1000
	meditations := make([]Meditation, mCount)
	ids := make([]string, mCount)
	for i := 0; i < mCount; i++ {
		id := strconv.Itoa(i)
		ids[i] = id
		m := Meditation{
			ID:        "benchmarkSeq-" + id,
			Name:      fmt.Sprintf("Meditation %d", i),
			Text:      "Meditation Text",
			Public:    false,
			UserId:    userId,
			CreatedAt: now,
			UpdatedAt: now,
		}
		meditations[i] = m

	}

	wg := sync.WaitGroup{}
	for _, m := range meditations {
		wg.Add(1)
		go func(m Meditation, wg *sync.WaitGroup) {
			store.SaveMeditation(m)
			wg.Done()
		}(m, &wg)
	}
	wg.Done()

	store.GetMeditationsByIds(ids)
}
