.PHONY: build clean deploy

build:
	env GOOS=linux go build -ldflags="-s -w" -o bin/tempora tempora.go ddb_store.go types.go handlers.go

clean:
	rm -rf ./bin

deploy: clean build
	sls deploy --verbose
