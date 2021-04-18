#!/bin/bash

## Test uploading a non-mp3

export AUTH_TOKEN="`node ~/git/tempora/scripts/getTestUserAuthToken.js`"

TEMP_JSON="`date '+%s'`.json"

echo "1) getting upload url..."
http https://1sctves1d1.execute-api.us-east-1.amazonaws.com/upload-url Authorization:"$AUTH_TOKEN" > "$TEMP_JSON"
UPLOAD_URL="`cat $TEMP_JSON | jq -r '.uploadUrl'`"
UPLOAD_KEY="`cat $TEMP_JSON | jq -r '.uploadKey'`"

echo "2) uploading mp3..."
http PUT "$UPLOAD_URL" < ~/git/tempora/go.mod

echo "3) creating meditation..."
http https://1sctves1d1.execute-api.us-east-1.amazonaws.com/meditations Authorization:"$AUTH_TOKEN" uploadKey="$UPLOAD_KEY" isPublic:='false' name="Evagrius On Prayer 5 (test)" text="Persist first in prayer to receive tears, so that through this grief you can tame the wildness that resides in your soul and so that by “testifying against yourself of your lawlessness to the Lord” you obtain from him release." --verbose

rm -f "$TEMP_JSON"

