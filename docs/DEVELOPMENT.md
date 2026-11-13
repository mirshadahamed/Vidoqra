# Vidoqra Developer Guide

## 1. Prerequisites

- **Node.js**: v18+ (Tested with v24)
- **Python**: 3.11+ (Tested with Python 3.15)
- **FFmpeg**: Installed locally or via Homebrew (`brew install ffmpeg`)
- **Docker & Docker Compose** (Optional for containerized run)

---

## 2. Local Setup (Without Docker)

### 2.1 Backend Setup
```bash
# 1. Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Create .env file
cp .env.example .env

# 4. Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API docs are available at `http://localhost:8000/docs`.

### 2.2 Optional: Running Celery & Redis
If you have Redis installed (`brew install redis && brew services start redis`):
```bash
# In a separate terminal with virtualenv active:
celery -A backend.app.workers.celery_app worker --loglevel=info
```
*Note: If Redis or Celery is not active, Vidoqra automatically falls back to its built-in async task executor and in-memory event bus.*

### 2.3 Frontend Setup
```bash
# 1. Enter frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 3. Running Tests

### Backend Unit & Integration Tests
```bash
source backend/venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

---

## 4. Running with Docker Compose

```bash
# Build and launch all services (MongoDB, Redis, Backend, Celery Worker, Frontend)
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

