package meditation

import (
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodbattribute"

	"fmt"
)

// var sess session

func createSessionIfNil() {

}

func CreateMeditation(record MeditationRecord) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1")},
	)

	svc := dynamodb.New(sess)

	av, err := dynamodbattribute.MarshalMap(record)

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String("tempora-golang-local"),
		Item:      av,
	})

	if err != nil {
		fmt.Println("Got error marshalling map or put record")
		fmt.Println(err.Error())
		os.Exit(1)
	}
}
