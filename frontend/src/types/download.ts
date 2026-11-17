export type JobStatus =
  | "Queued"
  | "Analyzing"
  | "Downloading"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Cancelled"

export interface DownloadJob {
  jobId: string
  sourceUrl: string
  sourceName: string
  title: string
  thumbnail?: string
  selectedFormat: string
  selectedQuality: string
  formatId: string
  status: JobStatus
  progress: number
  speed?: number
  eta?: number
  fileSize?: number
  downloadToken?: string
  downloadUrl?: string
  error?: string
  createdAt: string
  completedAt?: string
  expiresAt?: string
  extractAudioOnly?: boolean
  selectedSubtitle?: string
}

export interface DownloadHistoryItem {
  downloadId: string
  jobId: string
  title: string
  sourceName: string
  quality: string
  format: string
  fileSize?: number
  downloadToken?: string
  completedAt: string
  sourceUrl: string
  thumbnail?: string
}

export interface CreateDownloadRequest {
  sourceUrl: string
  formatId: string
  selectedFormat: string
  selectedQuality: string
  title?: string
  thumbnail?: string
  extractAudioOnly?: boolean
  selectedSubtitle?: string
}

