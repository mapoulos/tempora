# README


**Tempora**, an app for centering prayer. Create and share short meditations.

Backend:
- golang + DynamoDB, deployed on AWS Lambda + API Gateway

Frontend:
- react + typescript, with vite as the build tool


## Testing

### Backend

#### 1) run localstack

```bash
pip3 install localstack # if needed
localstack
```

#### 2) run the test suite

```bash
cd backend/
go test
```

