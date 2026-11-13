# Vidoqra REST & WebSocket API Specification

Base URL: `http://localhost:8000/api/v1`

All responses are formatted in JSON. Clients should provide the `X-Session-ID` header to associate jobs and history with an anonymous guest session.

---

## 1. Endpoints

### 1.1 Health Check
- **`GET /health`**
- Returns overall system and dependency status.
- Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "mongodb": true,
  "database_mode": "Atlas",
  "redis": true,
  "event_broker": "Redis PubSub"
}
```

### 1.2 Analyze Media URL
- **`POST /analyze`**
- Body:
```json
{
  "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
}
```
- Response:
```json
{
  "analysisId": "ana_498f390d4",
  "sourceUrl": "https://...",
  "platform": {
    "id": "direct_media",
    "name": "Direct Media Stream",
    "isDirect": true
  },
  "title": "BigBuckBunny",
  "duration": 596.0,
  "thumbnail": "https://...",
  "videoFormats": [
    {
      "formatId": "direct-mp4",
      "ext": "mp4",
      "resolution": "Original",
      "filesize": 158008374,
      "hasAudio": true,
      "hasVideo": true,
      "needsMerge": false,
      "qualityLabel": "Original MP4 Quality"
    }
  ],
  "audioFormats": [
    {
      "formatId": "direct-audio-extract",
      "ext": "mp3",
      "hasAudio": true,
      "hasVideo": false,
      "needsMerge": false,
      "qualityLabel": "Extract MP3 Audio (320 kbps)"
    }
  ],
  "subtitles": []
}
```

### 1.3 Retrieve Cached Formats
- **`GET /formats/{analysis_id}`**
- Returns the cached metadata and available formats for a previous analysis session.

### 1.4 Create Download Job
- **`POST /downloads`**
- Header: `X-Session-ID: guest_xxxx`
- Body:
```json
{
  "sourceUrl": "https://...",
  "formatId": "direct-mp4",
  "selectedFormat": "mp4",
  "selectedQuality": "Original MP4 Quality",
  "title": "Big Buck Bunny",
  "thumbnail": "https://...",
  "extractAudioOnly": false
}
```
- Response: `201 Created` with `DownloadJobResponse` object.

### 1.5 List Download Jobs
- **`GET /downloads`**
- Header: `X-Session-ID: guest_xxxx`
- Returns array of download jobs for the session.

### 1.6 Get Job Status
- **`GET /downloads/{job_id}`**
- Returns single job status, progress percentage, speed (bytes/s), and ETA (seconds).

### 1.7 Cancel Active Job
- **`DELETE /downloads/{job_id}`**
- Cancels an active download and cleans up temporary files.

### 1.8 Download Completed File
- **`GET /downloads/{job_id}/file?token={download_token}`**
- Returns binary stream (`Content-Disposition: attachment; filename="..."`).
- Access is strictly gated by the one-time `download_token`.

### 1.9 Download History
- **`GET /history?search=query`**
- Returns historical completed downloads for the current session.

### 1.10 Delete History Record
- **`DELETE /history/{download_id}`**
- Removes a record from the history collection.

---

## 2. WebSockets

- **`ws://localhost:8000/ws/downloads`**: Connects to the global session event stream.
- **`ws://localhost:8000/ws/downloads/{job_id}`**: Connects to real-time events for a specific job.

Event Payload Format:
```json
{
  "jobId": "job_019a82cd",
  "status": "Downloading",
  "progress": 67.5,
  "speed": 2450000,
  "eta": 12.3,
  "fileSize": 158008374
}
```

