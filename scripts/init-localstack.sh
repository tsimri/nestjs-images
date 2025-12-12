#!/bin/bash

# Skrypt do inicjalizacji bucketu S3 w LocalStack

BUCKET_NAME=${AWS_S3_BUCKET_NAME:-fm-bucket}
ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
REGION=${AWS_REGION:-us-east-1}

echo "Tworzenie bucketu S3: $BUCKET_NAME w LocalStack..."

aws --endpoint-url=$ENDPOINT_URL s3 mb s3://$BUCKET_NAME --region $REGION

if [ $? -eq 0 ]; then
  echo "Bucket $BUCKET_NAME został utworzony pomyślnie!"
  echo "Lista bucketów:"
  aws --endpoint-url=$ENDPOINT_URL s3 ls --region $REGION
else
  echo "Błąd podczas tworzenia bucketu. Możliwe, że bucket już istnieje."
fi

