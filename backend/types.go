package main

import (
	"os"
	"time"
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

type CreateMeditationInput struct {
	UploadKey string `json:"uploadKey" validate:"required,startswith=upload/"`
	Name      string `json:"name" validate:"required"`
	Text      string `json:"text" validate:"required"`
	Public    bool   `json:"isPublic"`
}

func getRegion() string {
	envRegion := os.Getenv("AWS_REGION")
	defaultRegion := "us-east-1"

	if envRegion == "" {
		return defaultRegion
	}

	return envRegion
}
