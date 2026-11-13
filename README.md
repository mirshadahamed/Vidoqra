# Vidoqra

> Your media. Simplified.

Vidoqra is a universal media format inspector and downloader. Submit a supported URL, inspect the genuine available video and audio formats, select your preferred quality, and retrieve media that you own or are authorized to access.

Built with Next.js, FastAPI, and FFmpeg.

---

## Features

- **Format Inspection** — Analyze URLs to discover authentic available resolutions (144p through 4K), audio streams, and bitrates. No fake upscaling.
- **Multi-Platform Adapters** — Pluggable adapter architecture supporting direct media streams, Internet Archive public media, and permitted extractor sources via yt-dlp.
- **Audio Extraction** — One-click audio conversion to MP3, AAC/M4A, or WAV.
- **Real-Time Progress** — Live WebSocket streaming with download speed, ETA, and job status tracking.
- **FFmpeg Stream Merging** — Background merging of separated video and audio streams.
- **SSRF Protection** — IP pre-resolution blocking for loopback, private subnets, cloud metadata endpoints, and DNS rebinding.
- **Session Isolation** — Secure guest sessions with cryptographically generated download tokens.
- **Light and Dark Themes** — Minimal Swiss editorial design with Instrument Serif headings and Geist interface typography.

---

## Technology Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui primitives, Lucide React, Framer Motion |
| Forms | React Hook Form, Zod |
| State | Zustand |

### Backend

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Language | Python 3.12+ |
| Validation | Pydantic v2 |
| Database | MongoDB Atlas with Motor (local fallback included) |
| Background Tasks | Celery with Redis (async fallback included) |
| Media Processing | FFmpeg, yt-dlp (authorized sources only) |
| Real-Time | WebSockets with Redis Pub/Sub |

---

## Project Structure

```
vidoqra/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST endpoints
│   │   ├── core/             # Configuration, database, events, logging, security
│   │   ├── integrations/     # Platform adapter engine
│   │   │   └── platforms/    # DirectMedia, InternetArchive, AuthorizedExtractor
│   │   ├── models/           # Data models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic
│   │   ├── utils/            # URL validation and SSRF protection
│   │   └── workers/          # Celery task definitions
│   ├── tests/                # Backend test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utility functions
│   │   ├── services/         # API client
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript type definitions
│   └── public/               # Static assets
├── docs/                     # Project documentation
├── storage/                  # Local media storage (gitignored)
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- FFmpeg (`brew install ffmpeg` on macOS)
- Docker and Docker Compose (optional)

### Backend

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

API documentation is available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Docker Compose

```bash
docker-compose up --build
```

---

## Environment Configuration

Copy `.env.example` to `.env` and adjust the values.

Key variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis URL for Celery and Pub/Sub |
| `SECRET_KEY` | Cryptographic signing key (must be replaced in production) |
| `FFMPEG_PATH` | Path to FFmpeg binary |
| `NEXT_PUBLIC_API_URL` | Backend URL for the frontend |
| `STORAGE_TYPE` | `local` or `s3` |

See `.env.example` for the complete list.

---

## Testing

Backend test suite:

```bash
source backend/venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

Frontend build verification:

```bash
cd frontend
npm run build
```

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [REST and WebSocket API](docs/API.md)
- [Developer Guide](docs/DEVELOPMENT.md)
- [Security Policies](docs/SECURITY.md)

---

## Screenshots

Screenshots will be added after the UI stabilizes.

---

## Roadmap

- User authentication and persistent accounts
- Batch URL processing
- S3 storage integration for production
- Rate limiting dashboard
- Subtitle download and embedding

---

## Acceptable Use

Vidoqra is designed for inspecting and retrieving media that users own, have explicit authorization to access, or that the provider makes publicly available.

---

## License

This project is licensed under the [MIT License](LICENSE).
