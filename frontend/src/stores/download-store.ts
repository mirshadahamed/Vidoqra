import { create } from "zustand"
import { MediaMetadata } from "@/types/media"
import { DownloadJob, DownloadHistoryItem } from "@/types/download"

interface DownloadState {
  // Session
  sessionId: string
  initSession: () => void

  // URL Analyzer State
  analyzingUrl: string
  isAnalyzing: boolean
  analysisError: string | null
  currentMetadata: MediaMetadata | null
  setAnalyzing: (status: boolean, url?: string) => void
  setAnalysisResult: (metadata: MediaMetadata | null) => void
  setAnalysisError: (err: string | null) => void
  clearAnalysis: () => void

  // Download Jobs State
  activeJobs: Record<string, DownloadJob>
  setActiveJobs: (jobs: DownloadJob[]) => void
  upsertJob: (job: DownloadJob) => void
  updateJobProgress: (
    jobId: string,
    progress: number,
    status: DownloadJob["status"],
    speed?: number,
    eta?: number,
    error?: string,
    downloadUrl?: string,
    downloadToken?: string
  ) => void
  removeJob: (jobId: string) => void

  // History State
  history: DownloadHistoryItem[]
  setHistory: (items: DownloadHistoryItem[]) => void
  removeHistoryItem: (downloadId: string) => void

  // UI state
  wsConnected: boolean
  setWsConnected: (connected: boolean) => void
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  sessionId: "",
  initSession: () => {
    if (typeof window === "undefined") return
    let sid = localStorage.getItem("vidoqra_session_id")
    if (!sid) {
      sid = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      localStorage.setItem("vidoqra_session_id", sid)
    }
    set({ sessionId: sid })
  },

  analyzingUrl: "",
  isAnalyzing: false,
  analysisError: null,
  currentMetadata: null,

  setAnalyzing: (status, url) => set({ isAnalyzing: status, analyzingUrl: url ?? get().analyzingUrl, analysisError: null }),
  setAnalysisResult: (metadata) => set({ currentMetadata: metadata, isAnalyzing: false, analysisError: null }),
  setAnalysisError: (err) => set({ analysisError: err, isAnalyzing: false }),
  clearAnalysis: () => set({ currentMetadata: null, analyzingUrl: "", analysisError: null, isAnalyzing: false }),

  activeJobs: {},
  setActiveJobs: (jobs) => {
    const jobMap: Record<string, DownloadJob> = {}
    for (const j of jobs) {
      jobMap[j.jobId] = j
    }
    set({ activeJobs: jobMap })
  },
  upsertJob: (job) => {
    set((state) => ({
      activeJobs: { ...state.activeJobs, [job.jobId]: job }
    }))
  },
  updateJobProgress: (jobId, progress, status, speed, eta, error, downloadUrl, downloadToken) => {
    set((state) => {
      const existing = state.activeJobs[jobId]
      if (!existing) return state
      return {
        activeJobs: {
          ...state.activeJobs,
          [jobId]: {
            ...existing,
            progress,
            status,
            speed: speed !== undefined ? speed : existing.speed,
            eta: eta !== undefined ? eta : existing.eta,
            error: error !== undefined ? error : existing.error,
            downloadUrl: downloadUrl || existing.downloadUrl,
            downloadToken: downloadToken || existing.downloadToken,
          }
        }
      }
    })
  },
  removeJob: (jobId) => {
    set((state) => {
      const copy = { ...state.activeJobs }
      delete copy[jobId]
      return { activeJobs: copy }
    })
  },

  history: [],
  setHistory: (items) => set({ history: items }),
  removeHistoryItem: (downloadId) =>
    set((state) => ({
      history: state.history.filter((item) => item.downloadId !== downloadId)
    })),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected })
}))

