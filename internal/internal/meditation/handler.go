package meditation

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
)

func MeditationHandler(req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	fmt.Println(req)

	fmt.Println(req.PathParameters)

	t := time.Now()

	meditation := Meditation{
		Author:     "Evagrius",
		Work:       "On Prayer",
		Name:       "1",
		AudioURL:   "http://smaple.url/audio.mp3",
		CreatedAt:  t.Format(time.RFC3339),
		ModifiedAt: t.Format(time.RFC3339),
	}
	json.Marshal(meditation)
	meditationJson, _ := json.Marshal(meditation)

	resp := events.APIGatewayV2HTTPResponse{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	return resp, nil
}
