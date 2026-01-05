#!/bin/bash

# 1. Trigger Release Build
echo "🏗️  Starting Android Release Build..."
cd android
if [ ! -f "./gradlew" ]; then
    echo "❌ Error: gradlew not found in android directory"
    exit 1
fi

chmod +x gradlew
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo "❌ Build Failed!"
    exit 1
fi
cd ..

# 2. Organize APK
# Define directories
SOURCE_DIR="android/app/build/outputs/apk/release"
SOURCE_FILE="$SOURCE_DIR/app-release.apk"
DEST_DIR="Builds"
APP_NAME="HabitTracker"

# Get current date and time
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
NEW_FILENAME="${APP_NAME}_${TIMESTAMP}.apk"

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source APK file NOT found at $SOURCE_FILE"
    echo "   Ensure the build actually produced an output."
    exit 1
fi

# Create destination directory if it doesn't exist
if [ ! -d "$DEST_DIR" ]; then
    mkdir -p "$DEST_DIR"
    echo "📂 Created '$DEST_DIR' directory."
fi

# Move and rename the file
mv "$SOURCE_FILE" "$DEST_DIR/$NEW_FILENAME"

# Verify move
if [ -f "$DEST_DIR/$NEW_FILENAME" ]; then
    echo "✅ Build & Organize Complete!"
    echo "   APK Location: $DEST_DIR/$NEW_FILENAME"
else
    echo "❌ Error: Failed to move APK file."
    exit 1
fi
