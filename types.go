package main

import (
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
	URL    string `json:"audioUrl" validate:"required,url"`
	Name   string `json:"name" validate:"required"`
	Text   string `json:"text" validate:"required"`
	Public bool   `json:"isPublic" validate:"required"`
}
