import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "mongodb" in data
        assert "redis" in data

@pytest.mark.asyncio
async def test_analyze_ssrf_blocked():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Loopback URL on port 80
        resp = await client.post("/api/v1/analyze", json={"url": "http://127.0.0.1/media.mp4"})
        assert resp.status_code == 400
        assert "restricted" in resp.json()["detail"].lower()

        # Non-standard port attempt
        resp_port = await client.post("/api/v1/analyze", json={"url": "http://127.0.0.1:8000/media.mp4"})
        assert resp_port.status_code == 400
        assert "security check failed" in resp_port.json()["detail"].lower()

@pytest.mark.asyncio
async def test_analyze_valid_direct_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        resp = await client.post("/api/v1/analyze", json={"url": url})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] is not None
        assert data["platform"]["id"] == "direct_media"
        assert len(data["videoFormats"]) > 0

        # Test formats lookup
        analysis_id = data["analysisId"]
        fmt_resp = await client.get(f"/api/v1/formats/{analysis_id}")
        assert fmt_resp.status_code == 200
        assert fmt_resp.json()["analysisId"] == analysis_id

@pytest.mark.asyncio
async def test_analyze_unsupported_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/analyze", json={"url": "https://example.com/not-a-video.html"})
        assert resp.status_code == 400
        assert "unable to analyze" in resp.json()["detail"].lower() or "unsupported" in resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_download_job_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = {"X-Session-ID": "test_session_lifecycle"}
        payload = {
            "sourceUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "formatId": "direct-mp4",
            "selectedFormat": "mp4",
            "selectedQuality": "Original Quality",
            "title": "Big Buck Bunny Sample",
        }
        create_resp = await client.post("/api/v1/downloads", json=payload, headers=headers)
        assert create_resp.status_code == 201
        job = create_resp.json()
        job_id = job["jobId"]
        assert job_id.startswith("job_")
        assert job["status"] in ("Queued", "Downloading", "Completed")

        # List downloads for session
        list_resp = await client.get("/api/v1/downloads", headers=headers)
        assert list_resp.status_code == 200
        jobs_list = list_resp.json()
        assert any(j["jobId"] == job_id for j in jobs_list)

        # Fetch single job
        status_resp = await client.get(f"/api/v1/downloads/{job_id}", headers=headers)
        assert status_resp.status_code == 200
        assert status_resp.json()["jobId"] == job_id

        # Cancel job
        cancel_resp = await client.delete(f"/api/v1/downloads/{job_id}", headers=headers)
        assert cancel_resp.status_code == 200

@pytest.mark.asyncio
async def test_unauthorized_file_download_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/downloads/non_existent_job/file?token=fake")
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_download_history_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = {"X-Session-ID": "test_history_session"}
        # Check initial empty history
        hist_resp = await client.get("/api/v1/history", headers=headers)
        assert hist_resp.status_code == 200
        assert isinstance(hist_resp.json(), list)
