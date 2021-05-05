package main

import (
	"os"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
)

type Meditation struct {
	ID        string    `json:"_id"`
	UserId    string    `json:"_userId"`
	CreatedAt time.Time `json:"_createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`

	URL    string `json:"audioUrl"`
	Name   string `json:"name"`
	Text   string `json:"text"`
	Public bool   `json:"isPublic"`
}

type Sequence struct {
	ID        string    `json:"_id"`
	UserId    string    `json:"_userId"`
	CreatedAt time.Time `json:"_createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`

	ImageURL    string       `json:"imageUrl"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Public      bool         `json:"isPublic"`
	Meditations []Meditation `json:"meditations" dynamodbav:"-"` // stored as a list of strings instead
}

type CreateMeditationInput struct {
	UploadKey string `json:"uploadKey" validate:"required,uploadKey"`
	Name      string `json:"name" validate:"required"`
	Text      string `json:"text" validate:"required"`
	Public    bool   `json:"isPublic"`
}

type UpdateMeditationInput struct {
	UploadKey string `json:"uploadKey" validate:"uploadKey"`
	Name      string `json:"name" validate:"required"`
	Text      string `json:"text" validate:"required"`
	Public    bool   `json:"isPublic"`
}

type CreateSequenceInput struct {
	UploadKey     string   `json:"uploadKey" validate:"required,uploadKey"`
	Name          string   `json:"name" validate:"required,excludes=<>"`
	Description   string   `json:"description" validate:"required"`
	Public        bool     `json:"isPublic"`
	MeditationIDs []string `json:"meditationIds"`
}

type UpdateSequenceInput struct {
	UploadKey     string   `json:"uploadKey" validate:"uploadKey"`
	Name          string   `json:"name" validate:"required,excludes=<>"`
	Description   string   `json:"description" validate:"required"`
	Public        bool     `json:"isPublic"`
	MeditationIDs []string `json:"meditationIds"`
}

func uploadKeyValidator(fl validator.FieldLevel) bool {
	uploadKey := fl.Field().String()

	if uploadKey == "" {
		return true
	}
	if strings.Contains(uploadKey, "..") {
		// directory traversal is bad...
		return false
	}
	if strings.HasPrefix(uploadKey, "upload/") {
		return true
	}

	return false
}

type UploadResponse struct {
	URL string `json:"uploadUrl"`
	Key string `json:"uploadKey"`
}

func getRegion() string {
	envRegion := os.Getenv("AWS_REGION")
	defaultRegion := "us-east-1"

	if envRegion == "" {
		return defaultRegion
	}

	return envRegion
}
