package main

import (
	"io"

	"github.com/hajimehoshi/go-mp3"
)

// returns duration in seconds
func mp3duration(r io.Reader) (int64, error) {
	decoder, err := mp3.NewDecoder(r)
	if err != nil {
		return -1, err
	}

	len := decoder.Length()
	sampleRate := decoder.SampleRate()
	duration := len / int64(sampleRate) / 4

	return duration, nil
}

func isDurationValid(duration int64) bool {
	if duration > 60 {
		return false
	}
	if duration < 0 {
		return false
	}
	return true
}
