import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes?: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs > 0) {
    return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s"
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return "Calculating..."
  if (seconds < 60) return `${Math.round(seconds)}s remaining`
  const mins = Math.ceil(seconds / 60)
  return `~${mins} min remaining`
}

