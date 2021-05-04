package main

// func ListSequenceHandler(req events.APIGatewayV2HTTPRequest, store *DynamoMeditationStore) *events.APIGatewayV2HTTPResponse {
// 	// get user id
// 	userId, ok := req.RequestContext.Authorizer.JWT.Claims["sub"]
// 	if !ok {
// 		return userIdNotFoundError()
// 	}

// 	sequences, err := store.ListSequencesByUserId(userId)

// 	// build the response
// 	responseBodyBytes, _ := json.Marshal(&newSequence)
// 	resp := entityCreated(string(responseBodyBytes))

// 	return resp
// }
