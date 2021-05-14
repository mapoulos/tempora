package main

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/abema/go-mp4"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/hajimehoshi/go-mp3"
)

// returns duration in seconds
func mp3duration(r io.ReadSeeker) (int64, error) {
	decoder, err := mp3.NewDecoder(r)
	if err != nil {
		return -1, err
	}

	len := decoder.Length()
	sampleRate := decoder.SampleRate()
	duration := len / int64(sampleRate) / 4

	return duration, nil
}

// returns duration in seconds
func m4aduration(r io.ReadSeeker) (int64, error) {
	info, err := mp4.Probe(r)
	if err != nil {
		return -1, err
	}
	durationInSeconds := info.Duration / uint64(info.Timescale)
	return int64(durationInSeconds), nil
}

func isDurationValid(duration int64) bool {
	if duration > 90 {
		return false
	}
	if duration < 0 {
		return false
	}
	return true
}

func ValidateAudio(uploadKey string, config *aws.Config) (string, error) {
	// AWS-ey stuff
	sess, _ := session.NewSession(config)
	svc := s3.New(sess)
	downloader := s3manager.NewDownloader(sess)

	// Get the content type
	contentTypeRequest := &s3.HeadObjectInput{
		Key:    &uploadKey,
		Bucket: aws.String(os.Getenv("AUDIO_BUCKET")),
	}
	contentTypeResponse, err := svc.HeadObject(contentTypeRequest)
	if err != nil {
		return "", err
	}
	isMp3 := *contentTypeResponse.ContentType == "audio/mpeg"
	isMp4 := *contentTypeResponse.ContentType == "audio/mp4"
	if !isMp3 && !isMp4 {
		return "", errors.New("file is not an mp4 or mp3")
	}

	// Read the audio file into memory from s3
	audioBuffer := aws.NewWriteAtBuffer([]byte{})
	_, err = downloader.Download(audioBuffer, &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("AUDIO_BUCKET")),
		Key:    &uploadKey,
	})
	if err != nil {
		return "", err
	}

	// get the duration in seconds of the m4a or mp3
	reader := bytes.NewReader(audioBuffer.Bytes())
	dur := int64(-1)
	fileExt := ""
	if isMp3 {
		fileExt = ".mp3"
		dur, err = mp3duration(reader)
	} else if isMp4 {
		fileExt = ".m4a"
		dur, err = m4aduration(reader)
	}
	if err != nil {
		return "", err
	}

	// confirm the duration is between 0 and 90 s
	isValid := isDurationValid(dur)
	if !isValid {
		return "", errors.New("duration of the mp3 is not valid (must be less than 1 minute)")
	}

	// return nil error for happy path
	return fileExt, nil
}

func ValidateImage(uploadKey string, config *aws.Config) (string, error) {
	sess, _ := session.NewSession(config)

	svc := s3.New(sess)

	bucket := os.Getenv("AUDIO_BUCKET")
	headItemRequest := &s3.HeadObjectInput{
		Bucket: &bucket,
		Key:    &uploadKey,
	}
	resp, err := svc.HeadObject(headItemRequest)
	if err != nil {
		return "", err
	}

	contentType := *resp.ContentType
	switch contentType {
	case "image/jpeg":
		return ".jpg", nil
	case "image/png":
		return ".png", nil
	}
	return "", errors.New("unknown image type")
}

func RenameImage(uploadKey string, destKey string, config *aws.Config) error {
	sess, _ := session.NewSession(config)

	svc := s3.New(sess)

	bucket := os.Getenv("AUDIO_BUCKET")
	copyObjectInput := s3.CopyObjectInput{
		Bucket:     &bucket,
		CopySource: aws.String(bucket + "/" + uploadKey),
		Key:        &destKey,
	}

	_, err := svc.CopyObject(&copyObjectInput)
	if err != nil {
		fmt.Println(err.Error())
		return err
	}
	err = svc.WaitUntilObjectExists(&s3.HeadObjectInput{
		Bucket: &bucket,
		Key:    &destKey,
	})

	if err != nil {
		fmt.Println(err.Error())
		return err
	}

	return nil
}

func RenameAudio(uploadKey string, destKey string, config *aws.Config) error {
	sess, _ := session.NewSession(config)

	svc := s3.New(sess)

	bucket := os.Getenv("AUDIO_BUCKET")
	copyObjectInput := s3.CopyObjectInput{
		Bucket:     &bucket,
		CopySource: aws.String(bucket + "/" + uploadKey),
		Key:        &destKey,
	}

	_, err := svc.CopyObject(&copyObjectInput)
	if err != nil {
		fmt.Println(err.Error())
		return err
	}
	err = svc.WaitUntilObjectExists(&s3.HeadObjectInput{
		Bucket: &bucket,
		Key:    &destKey,
	})

	if err != nil {
		fmt.Println(err.Error())
		return err
	}

	return nil
}

func mapPathSuffixToFullURL(suffix string) string {
	publicUrlBase := os.Getenv("PUBLIC_AUDIO_BASE")
	return "https://" + publicUrlBase + "/" + suffix
}
