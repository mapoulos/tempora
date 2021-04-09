module github.com/mapoulos/tempora-golang

go 1.16

require (
	github.com/aws/aws-lambda-go v1.23.0 // indirect
)

require internal/meditation v1.0.0
replace internal/meditation => ./internal/meditation