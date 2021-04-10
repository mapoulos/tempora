package main

import "time"

type Meditation struct {
	ID        string    `json:"_id"`
	UserId    string    `json:"_userId"`
	CreatedAt time.Time `json:"_createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`

	URL  string `json:"audioUrl"`
	Name string `json:"name"`
	Text string `json:"text"`
}

type CreateMeditationInput struct {
	URL  string `json:"audioUrl" binding:"required"`
	Name string `json:"name" binding:"required"`
	Text string `json:"text" binding:"required"`
}
