import { MediaMetadata } from "@/types/media"
import { DownloadJob, DownloadHistoryItem, CreateDownloadRequest } from "@/types/download"

export function getApiBase(): string {
  // 1. Explicit build/runtime environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  }

  // 2. Client-side dynamic resolution
  if (typeof window !== "undefined") {
    // User configured backend URL in Settings
    const custom = localStorage.getItem("vidoqra_backend_url")
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, "")
    }

    // When deployed on Vercel or any public domain without NEXT_PUBLIC_API_URL,
    // automatically connect to your deployed Vercel backend API.
    const host = window.location.hostname
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://vidoqra.vercel.app"
    }
  }

  // 3. Local development default
  return "http://localhost:8000"
}

export const API_BASE = getApiBase()

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = getApiBase()
  const cleanPath = path.startsWith("/") ? path : `/${path}`

  if (base) {
    const full = `${base}${cleanPath}`
    if (!params) return full
    const url = new URL(full)
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
    return url.toString()
  }

  // Relative URL for same-origin proxy
  if (!params) return cleanPath
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.set(k, v)
  })
  const qs = query.toString()
  return qs ? `${cleanPath}?${qs}` : cleanPath
}

function getSessionHeader(): HeadersInit {
  if (typeof window === "undefined") return {}
  const sid = localStorage.getItem("vidoqra_session_id") || "guest_default"
  return {
    "X-Session-ID": sid,
    "Content-Type": "application/json",
  }
}

export const api = {
  getApiBase,

  async checkHealth(): Promise<{ status: string; version: string; redis: boolean; mongodb: boolean }> {
    const res = await fetch(buildUrl("/api/v1/health"))
    if (!res.ok) throw new Error("Health check failed")
    return res.json()
  },

  async analyzeUrl(url: string): Promise<MediaMetadata> {
    const res = await fetch(buildUrl("/api/v1/analyze"), {
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
    const res = await fetch(buildUrl(`/api/v1/formats/${analysisId}`), {
      headers: getSessionHeader(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || "Failed to retrieve formats")
    }
    return data
  },

  async createDownloadJob(req: CreateDownloadRequest): Promise<DownloadJob> {
    const res = await fetch(buildUrl("/api/v1/downloads"), {
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
    const res = await fetch(buildUrl("/api/v1/downloads"), {
      headers: getSessionHeader(),
    })
    if (!res.ok) return []
    return res.json()
  },

  async getJobStatus(jobId: string): Promise<DownloadJob> {
    const res = await fetch(buildUrl(`/api/v1/downloads/${jobId}`), {
      headers: getSessionHeader(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || "Job not found")
    }
    return data
  },

  async cancelJob(jobId: string): Promise<boolean> {
    const res = await fetch(buildUrl(`/api/v1/downloads/${jobId}`), {
      method: "DELETE",
      headers: getSessionHeader(),
    })
    return res.ok
  },

  async getHistory(search?: string): Promise<DownloadHistoryItem[]> {
    const url = buildUrl("/api/v1/history", search ? { search } : undefined)
    const res = await fetch(url, {
      headers: getSessionHeader(),
    })
    if (!res.ok) return []
    return res.json()
  },

  async deleteHistoryItem(downloadId: string): Promise<boolean> {
    const res = await fetch(buildUrl(`/api/v1/history/${downloadId}`), {
      method: "DELETE",
      headers: getSessionHeader(),
    })
    return res.ok
  },

  getFileDownloadUrl(jobId: string, token?: string): string {
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ""
    return buildUrl(`/api/v1/downloads/${jobId}/file${tokenParam}`)
  },

  getWebSocketUrl(jobId?: string): string {
    const base = getApiBase()
    let wsBase: string

    if (!base) {
      if (typeof window !== "undefined") {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
        wsBase = `${proto}//${window.location.host}`
      } else {
        wsBase = "ws://localhost:8000"
      }
    } else {
      wsBase = base.replace(/^http/, "ws")
    }

    return jobId ? `${wsBase}/ws/downloads/${jobId}` : `${wsBase}/ws/downloads`
  },
}
