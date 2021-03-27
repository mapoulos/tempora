package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// Response is of type APIGatewayProxyResponse since we're leveraging the
// AWS Lambda Proxy Request functionality (default behavior)
//
// https://serverless.com/framework/docs/providers/aws/events/apigateway/#lambda-proxy-integration
type Response events.APIGatewayProxyResponse

//
type Meditation struct {
	Author   string `json:"author"`
	Work     string `json:"work"`
	Name     string `json:"name"`
	AudioURL string `json:"audioURL"`
}

// Handler is our lambda handler invoked by the `lambda.Start` function call
func Handler(ctx context.Context) (Response, error) {
	fmt.Println(ctx)

	meditation := Meditation{
		"Evagrius",
		"De oratione",
		"Evagrius On Prayer 1",
		"http://smaple.url/audio.mp3",
	}
	json.Marshal(meditation)
	meditationJson, _ := json.Marshal(meditation)

	resp := Response{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(meditationJson),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	return resp, nil
}

func main() {
	lambda.Start(Handler)
}
