# Vidoqra System Architecture

## 1. Executive Overview

**Vidoqra** is a modern, modular universal media format analyzer and downloader. The platform empowers users to submit supported media links, inspect authentic available video and audio streams, select their preferred output container and quality, and download media securely.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 Next.js 15+ Frontend                            |
|  (App Router, React 19, TypeScript, Tailwind CSS, Lucide, Framer Motion, Zustand)|
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | Landing & Hero     |  | Format Selector      |  | Real-Time Manager       |  |
|  | (UrlInput Module)  |  | (Genuine Resolutions)|  | (Live WebSockets + WS)  |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
+---------------------------------------------------------------------------------+
                                      |           ^
                   REST API Calls     |           |  Real-Time Progress
                   (FastAPI Endpoints)|           |  (WebSockets /ws/downloads)
                                      v           |
+---------------------------------------------------------------------------------+
|                                FastAPI Backend Engine                           |
|                                                                                 |
|  +---------------------+   +-----------------------+   +---------------------+  |
|  | Security Middleware |   | Platform Registry     |   | Event Bus           |  |
|  | (SSRF & DNS Guard)  |   | (Pluggable Adapters)  |   | (Pub/Sub & Sockets) |  |
|  +---------------------+   +-----------------------+   +---------------------+  |
+---------------------------------------------------------------------------------+
           |                                  |                        |
           v                                  v                        v
+-----------------------+          +--------------------+    +--------------------+
| MongoDB Atlas / Motor |          | Celery Worker &    |    | Storage Layer      |
| (Collections:         |          | FFmpeg Pipeline    |    | (Sandboxed Local / |
| DownloadJobs,         |          | (Stream Merging &  |    | S3 Compatible)     |
| DownloadHistory)      |          | Conversion)        |    |                    |
+-----------------------+          +--------------------+    +--------------------+
```

---

## 3. Core Architectural Modules

### 3.1 Modular Platform Adapter Engine

Platform adapters adhere to `BasePlatformAdapter` (`backend/app/integrations/base.py`):
1. **DirectMediaAdapter**: Detects direct media endpoints (`.mp4`, `.webm`, `.mp3`, `.m4a`, etc.), issues safe HTTP HEAD requests, probes MIME types, validates content lengths, and streams media.
2. **InternetArchiveAdapter**: Directly interacts with the official Internet Archive metadata API (`archive.org/metadata/{id}`) to resolve items, files, formats, and authorized download URLs.
3. **AuthorizedExtractorAdapter**: Sandboxed yt-dlp integration strictly for permitted media sources with zero DRM bypass, private content prevention, and safe argument passing.

### 3.2 Security & SSRF Protection Subsystem

The `validate_url_security` utility inspects every inbound URL:
- Enforces strict HTTP and HTTPS schemes.
- Resolves DNS addresses to inspect all IPv4 and IPv6 target IPs.
- Blocks RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local and cloud metadata addresses (`169.254.169.254`, `metadata.google.internal`).
- Enforces allowed port numbers (80, 443, 8080, 8443).
- Generates cryptographically secure, unguessable tokens for file downloads (`secrets.token_urlsafe(32)`).

### 3.3 Asynchronous Processing & Real-Time Events

1. Long-running download jobs are decoupled from HTTP request/response lifecycles.
2. When a job is initiated:
   - A `DownloadJob` document is created in MongoDB with status `Queued`.
   - The job is dispatched to Celery via Redis broker (or the asynchronous background task manager).
   - The worker downloads chunks, reports real download speeds and ETA without fake progress bars.
   - FFmpeg runs safely to remux or convert formats (e.g. merging video and audio or extracting MP3).
   - Event updates are published through the `EventBus` to Redis Pub/Sub and broadcast to active WebSockets.

