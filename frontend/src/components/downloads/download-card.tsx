"use client"

import React, { useState } from "react"
import { DownloadJob } from "@/types/download"
import { useDownloads } from "@/hooks/use-downloads"
import { api, API_BASE } from "@/services/api"
import { formatBytes } from "@/lib/utils"
import { ProgressIndicator } from "./progress-indicator"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  X, 
  RotateCw, 
  Film, 
  Music, 
  Check, 
  Clock, 
  AlertCircle 
} from "lucide-react"

interface DownloadCardProps {
  job: DownloadJob
}

export function DownloadCard({ job }: DownloadCardProps) {
  const { cancelDownload, startDownload } = useDownloads()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleDownloadFile = () => {
    let url = job.downloadUrl
    if (url) {
      if (!url.startsWith("http")) {
        url = `${API_BASE}${url}`
      }
    } else {
      url = api.getFileDownloadUrl(job.jobId, job.downloadToken)
    }
    window.open(url, "_blank")
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await startDownload({
        sourceUrl: job.sourceUrl,
        formatId: job.formatId,
        selectedFormat: job.selectedFormat,
        selectedQuality: job.selectedQuality,
        title: job.title,
        thumbnail: job.thumbnail,
        extractAudioOnly: job.extractAudioOnly,
        selectedSubtitle: job.selectedSubtitle,
      })
    } finally {
      setIsRetrying(false)
    }
  }

  const getStatusBadge = () => {
    switch (job.status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997]">
            <Check className="w-3 h-3" /> Completed
          </span>
        )
      case "Downloading":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997] animate-pulse">
            <Download className="w-3 h-3" /> Downloading
          </span>
        )
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#A6B4C2]/15 text-[#4D6073] dark:text-[#A6B4C2]">
            <RotateCw className="w-3 h-3 animate-spin" /> FFmpeg
          </span>
        )
      case "Queued":
      case "Analyzing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] bg-[#F5F4F0] dark:bg-[#111315]">
            <Clock className="w-3 h-3" /> {job.status}
          </span>
        )
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        )
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] bg-[#F5F4F0] dark:bg-[#111315]">
            <X className="w-3 h-3" /> Cancelled
          </span>
        )
    }
  }

  const isTerminal = job.status === "Completed" || job.status === "Failed" || job.status === "Cancelled"

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 sm:p-5 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
      {/* Thumbnail */}
      <div className="relative w-full md:w-44 aspect-video shrink-0 rounded-lg overflow-hidden bg-[#17191C] border border-[#E6E4DD] dark:border-[#303438]">
        {job.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={job.thumbnail}
            alt={job.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#74777C]">
            {job.extractAudioOnly ? <Music className="w-6 h-6" /> : <Film className="w-6 h-6" />}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono uppercase">
            {job.sourceName || "Media"}
          </span>
        </div>
      </div>

      {/* Main info & progress */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-xs font-mono text-[#17191C] dark:text-[#F4F4F0] font-medium">
                {job.selectedQuality} • {job.selectedFormat.toUpperCase()}
              </span>
              {job.fileSize && (
                <span className="text-xs font-mono text-[#74777C] dark:text-[#A0A4A7]">
                  • {formatBytes(job.fileSize)}
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7]">
              {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h4 className="font-serif text-base text-[#17191C] dark:text-[#F4F4F0] line-clamp-1">
            {job.title || "Processing Media..."}
          </h4>
          <p className="text-xs font-mono text-[#74777C] dark:text-[#A0A4A7] truncate max-w-lg mt-0.5">
            {job.sourceUrl}
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressIndicator
          progress={job.progress}
          status={job.status}
          speed={job.speed}
          eta={job.eta}
          error={job.error}
        />

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E6E4DD]/60 dark:border-[#303438]/60">
          <span className="text-[11px] text-[#74777C] dark:text-[#A0A4A7] font-mono">
            Job #{job.jobId.slice(0, 8)}
          </span>

          <div className="flex items-center gap-2">
            {!isTerminal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelDownload(job.jobId)}
                className="text-xs h-8 px-2.5"
              >
                Cancel
              </Button>
            )}

            {(job.status === "Failed" || job.status === "Cancelled") && (
              <Button
                variant="outline"
                size="sm"
                disabled={isRetrying}
                onClick={handleRetry}
                className="text-xs h-8 px-2.5 gap-1.5"
              >
                <RotateCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                <span>Retry</span>
              </Button>
            )}

            {job.status === "Completed" && (
              <Button
                size="sm"
                onClick={handleDownloadFile}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
