export interface MediaFormat {
  formatId: string
  ext: string
  resolution?: string
  width?: number
  height?: number
  fps?: number
  vcodec?: string
  acodec?: string
  filesize?: number
  filesizeApprox?: number
  hasAudio: boolean
  hasVideo: boolean
  needsMerge: boolean
  qualityLabel: string
  formatNote?: string
}

export interface MediaSubtitle {
  lang: string
  name: string
  ext: string
}

export interface MediaMetadata {
  analysisId: string
  sourceUrl: string
  platform: {
    id: string
    name: string
    isDirect: boolean
    badgeColor?: string
  }
  title: string
  duration?: number
  thumbnail?: string
  description?: string
  uploader?: string
  viewCount?: number
  videoFormats: MediaFormat[]
  audioFormats: MediaFormat[]
  subtitles?: MediaSubtitle[]
  createdAt: string
  isAuthorized: boolean
  notice?: string
}

export interface AnalyzeRequest {
  url: string
}

export interface AnalyzeResponse {
  success: boolean
  metadata?: MediaMetadata
  error?: string
}

