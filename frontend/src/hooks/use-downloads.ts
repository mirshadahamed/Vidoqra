"use client"

import { useEffect, useCallback } from "react"
import { useDownloadStore } from "@/stores/download-store"
import { api } from "@/services/api"
import { CreateDownloadRequest } from "@/types/download"

export function useDownloads() {
  const {
    sessionId,
    initSession,
    activeJobs,
    setActiveJobs,
    upsertJob,
    removeJob,
    history,
    setHistory,
    removeHistoryItem,
  } = useDownloadStore()

  useEffect(() => {
    initSession()
  }, [initSession])

  const refreshJobs = useCallback(async () => {
    try {
      const jobs = await api.getJobs()
      setActiveJobs(jobs)
    } catch {
      // Background refresh fail tolerated
    }
  }, [setActiveJobs])

  const refreshHistory = useCallback(async (search?: string) => {
    try {
      const items = await api.getHistory(search)
      setHistory(items)
    } catch {
      // Ignored
    }
  }, [setHistory])

  useEffect(() => {
    if (sessionId) {
      refreshJobs()
      refreshHistory()
    }
  }, [sessionId, refreshJobs, refreshHistory])

  const startDownload = async (req: CreateDownloadRequest) => {
    const job = await api.createDownloadJob(req)
    upsertJob(job)
    return job
  }

  const cancelDownload = async (jobId: string) => {
    const success = await api.cancelJob(jobId)
    if (success) {
      const existing = activeJobs[jobId]
      if (existing) {
        upsertJob({ ...existing, status: "Cancelled" })
      }
    }
    return success
  }

  const deleteHistory = async (downloadId: string) => {
    const success = await api.deleteHistoryItem(downloadId)
    if (success) {
      removeHistoryItem(downloadId)
    }
    return success
  }

  return {
    jobs: Object.values(activeJobs),
    activeCount: Object.values(activeJobs).filter(
      (j) => j.status === "Downloading" || j.status === "Processing" || j.status === "Queued" || j.status === "Analyzing"
    ).length,
    history,
    startDownload,
    cancelDownload,
    deleteHistory,
    refreshJobs,
    refreshHistory,
  }
}

