#!/bin/bash
set -e

echo "Starting script..."

# Check if /storage directory exists
if [ ! -d "/storage" ]; then
    echo "Error: /storage directory does not exist"
    exit 1
else
    echo "/storage directory exists"
fi

# Check permissions on /storage
ls -ld /storage
echo "Current user: $(whoami)"

# Mount the S3 bucket
echo "Attempting to mount S3 bucket..."
dotenvx run -f .env.production -- s3fs ph-storage /storage -o passwd_file=${HOME}/.passwd-s3fs -o url=https://db59eb944db359472048f5e9a5dbc7d7.r2.cloudflarestorage.com/ -o nomixupload -o endpoint=auto

# uncheck if you end up with race condition
# sleep 2

# Check if the mount was successful
if mountpoint -q /storage; then
    echo "S3 bucket mounted successfully"
else
    echo "Error: Failed to mount S3 bucket"
    exit 1
fi

# Check if /storage is empty
if [ -z "$(ls -A /storage)" ]; then
    echo "Warning: /storage directory is empty"
else
    echo "Files found in /storage!"
fi

# Start the FastAPI application
echo "Starting FastAPI application..."
exec dotenvx run -f .env.production -- uvicorn --host 0.0.0.0 --port 8000 --workers 3 product_horse.run_modal:app