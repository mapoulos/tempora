package main

import (
	"fmt"
	"strconv"
	"testing"

	uuid "github.com/satori/go.uuid"
)

func contains(meditations []Meditation, meditationToFind Meditation) bool {
	var match Meditation
	for _, m := range meditations {
		if m == meditationToFind {
			match = m
		}
	}
	return match != Meditation{}
}

func TestDynamoMeditationStore(t *testing.T) {
	t.Run("Test MemoryStore SaveMeditation", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := NewDynamoMeditationStore(tableName, true, true)

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

	t.Run("Test MemoryStore SaveMeditation and Get", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := NewDynamoMeditationStore(tableName, true, true)

		uuid := uuid.NewV4().String()
		userId := "alex"
		m := Meditation{
			UserId: userId,
			ID:     uuid,
			Name:   "Test Meditation",
			Public: false,
		}

		store.SaveMeditation(m)

		m2, err := store.GetMeditation(userId, uuid)
		if err != nil {
			t.Error("SaveMeditation and GetMeditation failed")
		}
		if m2 != m {
			t.Errorf("Expected %v Got %v", m, m2)
		}
	})

	t.Run("Test Multiple Creates and List", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := NewDynamoMeditationStore(tableName, true, true)

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
		store := NewDynamoMeditationStore(tableName, true, true)

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

		m, err := store.GetMeditation(userId, "0")
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

	t.Run("Test Delete", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := NewDynamoMeditationStore(tableName, true, true)

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

		m, err := store.GetMeditation(userId, "0")
		if err != nil {
			t.Error("Did not find meditation with ID 0")
		}
		store.DeleteMeditation(userId, "0")

		meditations, err := store.ListMeditations(userId)
		if err != nil {
			t.Error("Couldn't list medtations for userId " + userId)
		}
		if len(meditations) != numMeditations-1 {
			t.Errorf("Found %d meditations, Expected %d meditations", len(meditations), numMeditations)
		}
		if contains(meditations, m) {
			t.Errorf("Found meditation after deleting it!")
		}
	})

	t.Run("Test Public Meditations", func(t *testing.T) {
		tableName := uuid.NewV4().String()
		store := NewDynamoMeditationStore(tableName, true, true)

		users := []string{"gregory", "alexandria", "maximus"}

		numMeditations := 3
		for _, user := range users {
			for i := 0; i < numMeditations; i++ {
				store.SaveMeditation(Meditation{
					UserId: user,
					Name:   "Meditation Private " + strconv.Itoa(i),
					ID:     strconv.Itoa(i),
					Public: false,
				})
				store.SaveMeditation(Meditation{
					UserId: user,
					Name:   "Meditation Public " + strconv.Itoa(i),
					ID:     strconv.Itoa(i * 10),
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
