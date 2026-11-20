# Vidoqra — Production Deployment & Architecture Audit

> **Generated:** 2026-11-20  
> **Repository:** [github.com/mirshadahamed/Vidoqra](https://github.com/mirshadahamed/Vidoqra) (`main`)  
> **Status:** Production-Ready (Builds verified, tests passing 13/13)

---

## 1. Executive Summary & Root Cause Analysis

### Why Previous Deployments Encountered Issues:
1. **Serverless Limitations for Long-Running Media Workflows**:
   Vercel functions have hard execution limits (15 seconds on the Hobby tier), read-only filesystems (except ephemeral `/tmp`), and do not support persistent background daemons (`celery worker`) or long-lived WebSockets. Media download, FFmpeg multiplexing, and audio conversions inherently require sustained execution and persistent volumes.
2. **Monorepo Build Override Conflict**:
   The root directory had a legacy `vercel.json` with `"builds"`, which triggered Vercel to override the Next.js `frontend` directory settings and execute the Python entrypoint instead of compiling Next.js.
3. **Environment Variable Configuration**:
   The client-side API base required dynamic handling so both local dev (`localhost:8000`), Vercel same-origin rewrites (`/api/v1`), and external custom domains (`NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL`) work automatically without manual string edits.

---

## 2. Infrastructure Architecture

```
+---------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                 |
|                       (Desktop & Mobile Web Applications)                       |
+---------------------------------------------------------------------------------+
                                       |
                +----------------------+----------------------+
                | HTTPS (Web UI)                              | WSS / HTTPS (API)
                v                                             v
+-------------------------------+             +-----------------------------------+
|         VERCEL EDGE           |             |     PRODUCTION DOCKER HOST        |
|    Next.js 16 App Router      |             |   (VPS / Railway / Cloud Host)    |
|                               |             |                                   |
| - SSR & Static Generation     |             | +-------------------------------+ |
| - Custom Vidoqra Logo         |             | | Caddy 2 Reverse Proxy (HTTPS) | |
| - Dynamic API URL Resolution  |             | +-------------------------------+ |
| - Turbopack Bundles           |             |   |                 |             |
+-------------------------------+             |   | /api/* & /ws/*  | /docs       |
                                              |   v                 v             |
                                              | +-------------------------------+ |
                                              | |      FastAPI Application      | |
                                              | |  - REST API & WebSocket Bus   | |
                                              | |  - SSRF URL Pre-Validator     | |
                                              | |  - Token-Gated File Streaming | |
                                              | +-------------------------------+ |
                                              |   |                 |             |
                                              |   | Jobs            | Pub/Sub     |
                                              |   v                 v             |
                                              | +-------------+   +-------------+ |
                                              | | Redis 7.2   |<--| Celery      | |
                                              | | Queue/State |   | Workers (4) | |
                                              | +-------------+   +-------------+ |
                                              |                     | FFmpeg &    |
                                              |                     | yt-dlp      |
                                              |                     v             |
                                              |       +-----------------------+   |
                                              |       |   media_storage Vol   |   |
                                              |       | (/app/storage/media)  |   |
                                              |       +-----------------------+   |
                                              +-----------------------------------+
                                                                |
                                                                v
                                              +-----------------------------------+
                                              |       MongoDB Atlas Cluster       |
                                              |  - DownloadJobs Collection        |
                                              |  - DownloadHistory Collection     |
                                              +-----------------------------------+
```

---

## 3. Deployment Specifications by Component

### Component 1: Frontend (Next.js) — Hosted on Vercel
- **Root Directory**: `frontend`
- **Framework Preset**: `Next.js`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Your backend API domain (e.g. `https://api.yourdomain.com` or `https://vidoqra-api.up.railway.app`)
  - Type: `Config` (public client variable)
- **Features Verified**:
  - Clean Vidoqra logo and high-res tab favicon (`/icon.svg`).
  - Zero Next.js/Vercel placeholder branding.
  - Safe error messaging with direct link to backend settings.

### Component 2: Backend & Background Workers (FastAPI + Celery + Redis + FFmpeg)
- **Deployment Vehicle**: Docker (`docker-compose.prod.yml` or `Dockerfile.backend`)
- **Recommended Host**:
  - **Docker VPS** (Hetzner, DigitalOcean, Linode, AWS Lightsail: \$4–\$6/mo)
  - Or **Railway / Render** container service.
- **Port Bindings**:
  - `80` & `443` (Managed automatically by Caddy with free Let's Encrypt certificates)
  - Or `8000` directly if behind an existing load balancer.
- **Volumes**:
  - `media_storage`: Persistent volume mounted at `/app/storage/media` (shared between FastAPI and Celery worker).
- **Environment Variables**:
  - `MONGODB_URI`: MongoDB Atlas connection string.
  - `REDIS_URL`: `redis://redis:6379/0` (internal network).
  - `SECRET_KEY`: Cryptographically secure 32+ character key.
  - `ALLOWED_ORIGINS`: Comma-separated list including your Vercel domains (`https://vidoqra.vercel.app`).
  - `FFMPEG_PATH`: `/usr/bin/ffmpeg` (pre-installed in container).
  - `FILE_EXPIRY_HOURS`: `24`

---

## 4. Verification & Health Audit

| Test / Check | Command / Verification | Result |
|---|---|---|
| Backend Pytest Suite | `PYTHONPATH=. pytest backend/tests -v` | **13/13 Passed** |
| Frontend Turbopack Build | `npm run build` in `frontend/` | **9/9 Routes Compiled** |
| URL Security (SSRF Guard) | Pre-resolution blocking private IP / metadata | **Verified** |
| Token Security | Unguessable 32-byte download tokens | **Verified** |
| Database Fallback | Seamless switch to local storage if MongoDB offline | **Verified** |
| Queue Fallback | In-memory event bus if Redis offline | **Verified** |
