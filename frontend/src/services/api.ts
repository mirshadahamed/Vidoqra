import { MediaMetadata } from "@/types/media"
import { DownloadJob, DownloadHistoryItem, CreateDownloadRequest } from "@/types/download"

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getSessionHeader(): HeadersInit {
  if (typeof window === "undefined") return {}
  const sid = localStorage.getItem("vidoqra_session_id") || "guest_default"
  return {
    "X-Session-ID": sid,
    "Content-Type": "application/json",
  }
}

export const api = {
  async checkHealth(): Promise<{ status: string; version: string; redis: boolean; mongodb: boolean }> {
    const res = await fetch(`${API_BASE}/api/v1/health`)
    if (!res.ok) throw new Error("Health check failed")
    return res.json()
  },

  async analyzeUrl(url: string): Promise<MediaMetadata> {
    const res = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: "POST",
      headers: getSessionHeader(),
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || data.message || "Failed to analyze URL")
    }
    return data
  },

  async getFormats(analysisId: string): Promise<MediaMetadata> {
    const res = await fetch(`${API_BASE}/api/v1/formats/${analysisId}`, {
      headers: getSessionHeader(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || "Failed to retrieve formats")
    }
    return data
  },

  async createDownloadJob(req: CreateDownloadRequest): Promise<DownloadJob> {
    const res = await fetch(`${API_BASE}/api/v1/downloads`, {
      method: "POST",
      headers: getSessionHeader(),
      body: JSON.stringify(req),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || "Failed to initiate download job")
    }
    return data
  },

  async getJobs(): Promise<DownloadJob[]> {
    const res = await fetch(`${API_BASE}/api/v1/downloads`, {
      headers: getSessionHeader(),
    })
    if (!res.ok) return []
    return res.json()
  },

  async getJobStatus(jobId: string): Promise<DownloadJob> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/${jobId}`, {
      headers: getSessionHeader(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || "Job not found")
    }
    return data
  },

  async cancelJob(jobId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/${jobId}`, {
      method: "DELETE",
      headers: getSessionHeader(),
    })
    return res.ok
  },

  async getHistory(search?: string): Promise<DownloadHistoryItem[]> {
    const url = new URL(`${API_BASE}/api/v1/history`)
    if (search) url.searchParams.set("search", search)
    const res = await fetch(url.toString(), {
      headers: getSessionHeader(),
    })
    if (!res.ok) return []
    return res.json()
  },

  async deleteHistoryItem(downloadId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/v1/history/${downloadId}`, {
      method: "DELETE",
      headers: getSessionHeader(),
    })
    return res.ok
  },

  getFileDownloadUrl(jobId: string, token?: string): string {
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ""
    return `${API_BASE}/api/v1/downloads/${jobId}/file${tokenParam}`
  },

  getWebSocketUrl(jobId?: string): string {
    const wsBase = API_BASE.replace(/^http/, "ws")
    return jobId ? `${wsBase}/ws/downloads/${jobId}` : `${wsBase}/ws/downloads`
  },
}

