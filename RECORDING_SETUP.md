# Recording System Setup Guide

This guide explains how to ensure the recording, uploading, and audio extraction features work correctly in the RCC platform.

## 1. Prerequisites

### Docker Environment
- Ensure Docker Desktop is running.
- The `livekit-egress` service must be running and healthy.
- **Critical**: Volume mapping must point to the current project directory. If you move the project, you must restart Docker.

### Dependencies
- The backend requires `ffmpeg-static` and `ffprobe-static` to process video files.
- If you see `EBUSY` or `ENOENT` errors in the logs, it means the FFmpeg binary is missing or locked.

## 2. Setup Steps

### Step 1: Start Docker Containers
Navigate to the project root and run:
```bash
docker-compose down
docker-compose up -d
```
*This ensures the volumes are correctly mapped to your current workspace.*

### Step 2: Verify Directory Permissions
The backend automatically attempts to set permissions, but you can verify them manually:
- **Windows**: `icacls apps\backend\uploads /grant "Everyone:(OI)(CI)F" /T`
- **Linux**: `chmod -R 777 apps/backend/uploads`

### Step 3: Install FFmpeg Binary (If missing)
If the backend logs show `spawn ffmpeg ENOENT`, the binary didn't download. Fix it by running:
```bash
node node_modules/ffmpeg-static/install.js
```
*Wait for the download to complete (approx. 82MB).*

### Step 4: Verify FFmpeg Installation
Run:
```bash
ffmpeg -version
```
You should see the version information.

### Step 5: Add Environment Variables
Add the following environment variables to your `.env` file:
```env
TRANSCRIBER_PROVIDER=arazn
ARAZN_TRANSCRIBER_URL=http://34.79.2.112:8000
```

## 3. Verification Workflow

1.  **Start a Call**: Open the frontend and start a room call.
2.  **Verify Recording Start**: Check the `livekit-egress` logs:
    ```bash
    docker logs rcc-livekit-egress
    ```
    You should see `egress_started`.
3.  **End the Call**: Hang up the call to trigger the saving process.
4.  **Check Filesystem**:
    Navigate to `apps/backend/uploads/recordings/`. You should see:
    - A `.mp4` file (the raw recording).
    - A `.mp3` file (the extracted audio).
    - A `.json` metadata file.
5.  **Verify Transcription**: The `.mp3` file is automatically sent to the transcription service. Check the recordings table in the UI for the "COMPLETED" status.

## Troubleshooting

- **Files not appearing**: Verify Docker volumes. Run `docker inspect rcc-livekit-egress` and check the "Mounts" section.
- **Audio extraction fails**: Ensure `ffmpeg.exe` exists in `node_modules/ffmpeg-static/`.
- **Permission Denied**: Run the terminal as Administrator and re-run the `icacls` command.
