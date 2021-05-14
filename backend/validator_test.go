// +build test

package main

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

func TestValidation(t *testing.T) {
	validator := validator.New()
	validator.RegisterValidation("uploadKey", uploadKeyValidator)

	t.Run("Test Optional Upload Key for Update Meditation", func(t *testing.T) {
		m := UpdateMeditationInput{
			Text:   "Blarg",
			Name:   "Test name",
			Public: false,
		}

		err := validator.Struct(m)
		if err != nil {
			t.Error(err.Error())
		}
	})

	t.Run("Test UploadKey required for Create", func(t *testing.T) {
		m := CreateMeditationInput{
			UploadKey: "",
			Text:      "Blarg",
			Name:      "Test name",
			Public:    false,
		}

		err := validator.Struct(m)
		if err == nil {
			t.Error("Expected uploadKey to be required")
		}
	})

	t.Run("Ensure path traversal is excluded (..)", func(t *testing.T) {
		m := CreateMeditationInput{
			UploadKey: "upload/../path",
			Text:      "Blarg",
			Name:      "Test name",
			Public:    false,
		}

		err := validator.Struct(m)
		if err == nil {
			t.Error("Expected path traversal to be blocked")
		}
	})
}
