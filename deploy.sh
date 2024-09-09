#!/bin/bash

set -e

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MAIN_LOG_FILE"
}

# Check if we're in the correct directory
if [[ $(basename "$PWD") != "product_horse" || ! -f "pyproject.toml" || ! -d ".venv" ]]; then
    echo "Error: Must be run from the 'product_horse' directory with pyproject.toml and .venv present."
    exit 1
fi

# Set up logging
DATETIME=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="deploy_logs/$DATETIME"
mkdir -p "$LOG_DIR"
MAIN_LOG_FILE="$LOG_DIR/main.log"

# Redirect all output to the log file
exec > >(tee -a "$MAIN_LOG_FILE") 2>&1

log_message "Starting deployment process..."

# Initialize status variables
SYNC_STATUS=0
FRONTEND_BUILD_STATUS=0
EXPORT_STATUS=0
BUILD_STATUS=0
GPU_DEPLOY_STATUS=0
MAIN_DEPLOY_STATUS=0

# Activate the virtual environment
source .venv/bin/activate

# 0.0. Run rye sync and generate requirements files
log_message "Syncing dependencies and generating requirements..."
if rye sync && ./gen_no_media_reqs.sh; then
    SYNC_STATUS=0
else
    SYNC_STATUS=1
    log_message "Error: Failed to sync dependencies or generate requirements."
fi

# 0.1. Run frontend build
log_message "Building frontend..."
if dotenvx run -f .env.production -- npm run build --prefix frontend; then
    FRONTEND_BUILD_STATUS=0
else
    FRONTEND_BUILD_STATUS=1
    log_message "Error: Frontend build failed."
fi

# 0.2. Run nbdev_export
log_message "Running nbdev_export..."
if nbdev_export; then
    EXPORT_STATUS=0
else
    EXPORT_STATUS=1
    log_message "Error: nbdev_export failed."
fi

# 1. Run hatch build
log_message "Building with hatch..."
if hatch build; then
    BUILD_STATUS=0
else
    BUILD_STATUS=1
    log_message "Error: Hatch build failed."
fi

# 2. Copy files from /dist to /gpu_app
log_message "Copying dist files to gpu_app..."
mkdir -p gpu_app
if cp dist/*.whl dist/*.tar.gz gpu_app/; then
    log_message "Files copied successfully."
else
    log_message "Error: Failed to copy files."
fi

# 3. Run deployments in parallel
log_message "Deploying..."
GPU_DEPLOY_LOG="$LOG_DIR/gpu_deploy.log"
MAIN_DEPLOY_LOG="$LOG_DIR/main_deploy.log"

fly deploy -c gpu_app/fly.toml > "$GPU_DEPLOY_LOG" 2>&1 &
GPU_PID=$!
fly deploy > "$MAIN_DEPLOY_LOG" 2>&1 &
MAIN_PID=$!

wait $GPU_PID
GPU_DEPLOY_STATUS=$?
wait $MAIN_PID
MAIN_DEPLOY_STATUS=$?

# Log deployment results
if [ $GPU_DEPLOY_STATUS -eq 0 ]; then
    log_message "GPU app deployed successfully"
else
    log_message "GPU app deployment failed. Check $GPU_DEPLOY_LOG for details."
    log_message "Last 10 lines of GPU deployment log:"
    tail -n 10 "$GPU_DEPLOY_LOG" | sed 's/^/    /' >> "$MAIN_LOG_FILE"
fi

if [ $MAIN_DEPLOY_STATUS -eq 0 ]; then
    log_message "Main app deployed successfully"
else
    log_message "Main app deployment failed. Check $MAIN_DEPLOY_LOG for details."
    log_message "Last 10 lines of Main deployment log:"
    tail -n 10 "$MAIN_DEPLOY_LOG" | sed 's/^/    /' >> "$MAIN_LOG_FILE"
fi

# 4. Clean up
log_message "Cleaning up..."
rm -rf dist  # Remove dist directory

# Generate summary
log_message "Deployment Summary:"
log_message "-------------------"
[ $SYNC_STATUS -eq 0 ] && log_message "✅ Dependency sync and requirements generation: Passed" || log_message "❌ Dependency sync and requirements generation: Failed"
[ $EXPORT_STATUS -eq 0 ] && log_message "✅ nbdev_export: Passed" || log_message "❌ nbdev_export: Failed"
[ $BUILD_STATUS -eq 0 ] && log_message "✅ Hatch build: Passed" || log_message "❌ Hatch build: Failed"
[ $GPU_DEPLOY_STATUS -eq 0 ] && log_message "✅ GPU app deployment: Passed" || log_message "❌ GPU app deployment: Failed"
[ $MAIN_DEPLOY_STATUS -eq 0 ] && log_message "✅ Main app deployment: Passed" || log_message "❌ Main app deployment: Failed"

log_message "Deployment process completed."