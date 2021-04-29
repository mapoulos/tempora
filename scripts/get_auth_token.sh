#!/bin/bash

CLIENT_ID="`aws ssm get-parameter --name /tempora/dev/auth0/client_id | jq -r '.Parameter.Value'`"
CLIENT_SECRET="`aws ssm get-parameter --name /tempora/dev/auth0/client_password --with-decryption | jq -r '.Parameter.Value'`"
AUDIENCE="`aws ssm get-parameter --name /tempora/dev/auth0/audience | jq -r '.Parameter.Value'`"


http https://equulus.us.auth0.com/oauth/token client_id=$CLIENT_ID client_secret="$CLIENT_SECRET" audience="$AUDIENCE" grant_type="client_credentials" | jq -r ".access_token"
