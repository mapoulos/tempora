.PHONY: build clean deploy

build:
	env GOOS=linux go build -ldflags="-s -w" -o bin/meditation meditation.go ddb_store.go types.go handlers.go mp3.go


clean:
	rm -rf ./bin

deploy: clean build
	sls deploy --verbose
