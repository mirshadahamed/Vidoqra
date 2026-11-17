import React from "react"
import { JobStatus } from "@/types/download"
import { formatSpeed, formatEta } from "@/lib/utils"

interface ProgressIndicatorProps {
  progress: number
  status: JobStatus
  speed?: number
  eta?: number
  error?: string
}

export function ProgressIndicator({
  progress,
  status,
  speed,
  eta,
  error,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)))

  const getProgressColor = () => {
    switch (status) {
      case "Completed":
        return "bg-[#526F61] dark:bg-[#8BA997]"
      case "Failed":
      case "Cancelled":
        return "bg-rose-500"
      case "Processing":
        return "bg-[#A6B4C2]"
      default:
        return "bg-[#526F61] dark:bg-[#8BA997]"
    }
  }

  return (
    <div className="space-y-2 w-full">
      {/* Telemetry and metrics header */}
      <div className="flex items-center justify-between text-xs font-mono text-[#74777C] dark:text-[#A0A4A7]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#17191C] dark:text-[#F4F4F0]">
            {clampedProgress}%
          </span>
          {status === "Downloading" && speed && (
            <span>{formatSpeed(speed)}</span>
          )}
          {status === "Processing" && (
            <span className="text-[#526F61] dark:text-[#8BA997] animate-pulse">
              FFmpeg Multiplexing...
            </span>
          )}
        </div>

        <div>
          {status === "Downloading" && eta !== undefined && (
            <span>ETA: {formatEta(eta)}</span>
          )}
          {status === "Completed" && (
            <span className="text-[#526F61] dark:text-[#8BA997] font-medium">
              Completed
            </span>
          )}
          {status === "Failed" && (
            <span className="text-rose-500 font-medium">Failed</span>
          )}
        </div>
      </div>

      {/* Minimal Thin Progress Bar */}
      <div className="relative h-1.5 w-full rounded-full bg-[#E6E4DD] dark:bg-[#303438] overflow-hidden">
        <div
          className={`h-full rounded-full ${getProgressColor()} transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 font-mono line-clamp-1 pt-1">
          {error}
        </p>
      )}
    </div>
  )
}
