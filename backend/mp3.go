package main

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudfront"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
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
	if duration > 90 {
		return false
	}
	if duration < 0 {
		return false
	}
	return true
}

func ValidateMP3(uploadKey string) error {
	sess, _ := session.NewSession(&aws.Config{
		Region: aws.String(getRegion()),
	})
	downloader := s3manager.NewDownloader(sess)
	audioBuffer := aws.NewWriteAtBuffer([]byte{})
	_, err := downloader.Download(audioBuffer, &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("AUDIO_BUCKET")),
		Key:    &uploadKey,
	})
	if err != nil {
		return err
	}
	reader := bytes.NewReader(audioBuffer.Bytes())

	dur, err := mp3duration(reader)
	if err != nil {
		return err
	}

	isValid := isDurationValid(dur)
	if !isValid {
		return errors.New("duration of the mp3 is not valid (must be less than 1 minute)")
	}
	return nil
}

func RenameMP3(uploadKey string, destKey string) error {
	sess, _ := session.NewSession(&aws.Config{
		Region: aws.String(getRegion()),
	})

	svc := s3.New(sess)

	bucket := os.Getenv("AUDIO_BUCKET")
	copyObjectInput := s3.CopyObjectInput{
		Bucket:            &bucket,
		CopySource:        aws.String(bucket + "/" + uploadKey),
		Key:               &destKey,
		ContentType:       aws.String("audio/mpeg"),
		MetadataDirective: aws.String(s3.MetadataDirectiveReplace),
	}
	fmt.Println(copyObjectInput)
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

func mapUUIDToPublicURL(uuid string) string {
	publicUrlBase := os.Getenv("PUBLIC_AUDIO_BASE")
	return "https://" + publicUrlBase + "/" + uuid + ".mp3"
}

func mapMp3PathSuffixToFullURL(suffix string) string {
	publicUrlBase := os.Getenv("PUBLIC_AUDIO_BASE")
	return "https://" + publicUrlBase + "/" + suffix
}

func invalidateCacheForUuid(uuid string) error {
	sess, _ := session.NewSession(&aws.Config{
		Region: aws.String(getRegion()),
	})
	svc := cloudfront.New(sess)
	now := time.Now()

	distributionId := os.Getenv("CLOUDFRONT_DISTRIBUTION_ID")

	invalidationRequest := cloudfront.CreateInvalidationInput{
		DistributionId: &distributionId,
		InvalidationBatch: &cloudfront.InvalidationBatch{
			CallerReference: aws.String(now.String()),
			Paths: &cloudfront.Paths{
				Quantity: aws.Int64(1),
				Items: []*string{
					aws.String(uuid + ".mp3"),
				},
			},
		},
	}

	svc.CreateInvalidation(&invalidationRequest)
	return nil
}
