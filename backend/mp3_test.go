package main

import (
	"os"
	"testing"
)

func TestMP3Validation(t *testing.T) {
	t.Run("Test a valid MP3 file", func(t *testing.T) {
		f, _ := os.Open("../media/evagrius.onprayer.003.mp3")

		duration, err := mp3duration(f)
		if err != nil {
			t.Error("Expected valid MP3")
			t.Error(err.Error())
		}
		if duration < 1 {
			t.Error("Expected positive duration")
		}
	})

	t.Run("Test a non existent MP3 file", func(t *testing.T) {
		f, _ := os.Open("../media/I_DONT_EXIST.mp3")

		_, err := mp3duration(f)
		if err == nil {
			t.Error("Expected an error message, but got nothing")
		}
	})

	t.Run("Reject an mp3 that is too long", func(t *testing.T) {
		f, _ := os.Open("../media/too_long_2m_9s.mp3")

		duration, _ := mp3duration(f)
		valid := isDurationValid(duration)
		if valid {
			t.Error("Expected a valid duration, got invalid duration")
		}
	})

	t.Run("Accept an mp3 that is less than 90s", func(t *testing.T) {
		f, _ := os.Open("../media/evagrius.onprayer.003.mp3")

		duration, _ := mp3duration(f)
		valid := isDurationValid(duration)
		if !valid {
			t.Error("Expected a valid duration, got invalid duration")
		}
	})
}
