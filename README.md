# VideoSplitter

A React Native app to split videos into smaller segments.

## Features
- Select video from gallery/files.
- Choose split duration (5s, 10s, 15s, or custom).
- Split video using FFmpeg.
- View logs of the process.

## Prerequisites
- Node.js
- Android Studio (for Android) or Xcode (for iOS)
- React Native CLI environment setup

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Metro Bundler:
   ```bash
   npm start
   ```

3. Run on Android:
   ```bash
   npm run android
   ```

4. Run on iOS (Mac only):
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

## Troubleshooting
- If you encounter FFmpeg errors, ensure the architecture is supported (default package usually supports arm64-v8a, armeabi-v7a, x86, x86_64).
- On Android, if "Copy failed" occurs, try selecting a file from local storage instead of cloud providers like Google Drive directly, or ensure the file is downloaded.
