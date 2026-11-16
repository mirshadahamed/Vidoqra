"use client"

import React, { useState } from "react"
import { MediaMetadata, MediaFormat } from "@/types/media"
import { formatBytes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Film, 
  Music, 
  Subtitles, 
  Check, 
  Download, 
  Loader2, 
  Layers
} from "lucide-react"

interface FormatSelectorProps {
  metadata: MediaMetadata
  onSelectFormat: (options: {
    formatId: string
    selectedFormat: string
    selectedQuality: string
    extractAudioOnly?: boolean
    selectedSubtitle?: string
  }) => void
  isSubmitting?: boolean
}

export function FormatSelector({
  metadata,
  onSelectFormat,
  isSubmitting = false,
}: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "subtitles">("video")
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    metadata.videoFormats[0]?.formatId || metadata.audioFormats[0]?.formatId || ""
  )
  const [selectedAudioCodec, setSelectedAudioCodec] = useState<"mp3" | "m4a" | "wav">("mp3")
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("")

  const currentSelectedFormat =
    metadata.videoFormats.find((f) => f.formatId === selectedFormatId) ||
    metadata.audioFormats.find((f) => f.formatId === selectedFormatId)

  const handleDownloadClick = () => {
    if (activeTab === "video") {
      const fmt = metadata.videoFormats.find((f) => f.formatId === selectedFormatId)
      if (!fmt) return
      onSelectFormat({
        formatId: fmt.formatId,
        selectedFormat: fmt.ext,
        selectedQuality: fmt.qualityLabel || fmt.resolution || "Best",
        extractAudioOnly: false,
        selectedSubtitle: selectedSubtitle || undefined,
      })
    } else if (activeTab === "audio") {
      const fmt = metadata.audioFormats.find((f) => f.formatId === selectedFormatId) || metadata.audioFormats[0]
      onSelectFormat({
        formatId: fmt?.formatId || "bestaudio",
        selectedFormat: selectedAudioCodec,
        selectedQuality: fmt?.qualityLabel || `Extracted ${selectedAudioCodec.toUpperCase()} Audio`,
        extractAudioOnly: true,
      })
    }
  }

  return (
    <div className="rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E4DD]/70 dark:border-[#303438]/70 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block mb-1">
            Format Selection
          </span>
          <h3 className="font-serif text-xl text-[#17191C] dark:text-[#F4F4F0]">
            Available Streams & Audio Options
          </h3>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("video")
              if (metadata.videoFormats.length > 0) {
                setSelectedFormatId(metadata.videoFormats[0].formatId)
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "video"
                ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video ({metadata.videoFormats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("audio")
              if (metadata.audioFormats.length > 0) {
                setSelectedFormatId(metadata.audioFormats[0].formatId)
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "audio"
                ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio ({metadata.audioFormats.length})</span>
          </button>

          {metadata.subtitles && metadata.subtitles.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("subtitles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "subtitles"
                  ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Subtitles</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Stream Matrix */}
      {activeTab === "video" && (
        <div className="space-y-4">
          {metadata.videoFormats.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#74777C] dark:text-[#A0A4A7] bg-[#F5F4F0] dark:bg-[#111315] rounded-lg border border-[#E6E4DD] dark:border-[#303438]">
              No standalone video streams found for this source.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {metadata.videoFormats.map((fmt) => {
                const isSelected = selectedFormatId === fmt.formatId
                const sizeDisplay = fmt.filesize
                  ? formatBytes(fmt.filesize)
                  : fmt.filesizeApprox
                  ? `~${formatBytes(fmt.filesizeApprox)}`
                  : "Direct Stream"

                return (
                  <button
                    key={fmt.formatId}
                    type="button"
                    onClick={() => setSelectedFormatId(fmt.formatId)}
                    className={`relative p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#526F61] dark:border-[#8BA997] bg-[#526F61]/5 dark:bg-[#8BA997]/10"
                        : "border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] hover:border-[#526F61]/40 dark:hover:border-[#8BA997]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm font-semibold text-[#17191C] dark:text-[#F4F4F0]">
                        {fmt.qualityLabel || fmt.resolution || "Auto Quality"}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] text-[#74777C] dark:text-[#A0A4A7]">
                        {fmt.ext.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#74777C] dark:text-[#A0A4A7] font-mono">
                      <span>{sizeDisplay}</span>
                      {fmt.fps && <span>{fmt.fps} fps</span>}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 text-[#526F61] dark:text-[#8BA997]">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Audio Extraction Matrix */}
      {activeTab === "audio" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] space-y-3">
            <span className="text-xs font-mono font-medium text-[#74777C] dark:text-[#A0A4A7] uppercase block">
              Output Audio Format
            </span>
            <div className="flex flex-wrap gap-2">
              {(["mp3", "m4a", "wav"] as const).map((codec) => (
                <button
                  key={codec}
                  type="button"
                  onClick={() => setSelectedAudioCodec(codec)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase transition-colors border ${
                    selectedAudioCodec === codec
                      ? "bg-[#526F61] dark:bg-[#8BA997] text-white dark:text-[#111315] border-transparent font-medium"
                      : "bg-white dark:bg-[#191C1F] text-[#74777C] dark:text-[#A0A4A7] border-[#E6E4DD] dark:border-[#303438] hover:border-[#526F61]/50"
                  }`}
                >
                  {codec === "mp3" && "MP3 • Universal (320kbps)"}
                  {codec === "m4a" && "M4A • AAC Lossless Copy"}
                  {codec === "wav" && "WAV • Uncompressed Audio"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtitles Tab */}
      {activeTab === "subtitles" && metadata.subtitles && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-[#74777C] dark:text-[#A0A4A7] uppercase block">
            Select Embedded Subtitle Track
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubtitle("")}
              className={`p-3 rounded-lg border text-left text-xs font-mono transition-colors ${
                !selectedSubtitle
                  ? "border-[#526F61] dark:border-[#8BA997] bg-[#526F61]/5 text-[#526F61] dark:text-[#8BA997]"
                  : "border-[#E6E4DD] dark:border-[#303438] text-[#74777C] dark:text-[#A0A4A7]"
              }`}
            >
              No Subtitles
            </button>
            {metadata.subtitles.map((sub) => (
              <button
                key={sub.lang}
                type="button"
                onClick={() => setSelectedSubtitle(sub.lang)}
                className={`p-3 rounded-lg border text-left text-xs font-mono transition-colors ${
                  selectedSubtitle === sub.lang
                    ? "border-[#526F61] dark:border-[#8BA997] bg-[#526F61]/5 text-[#526F61] dark:text-[#8BA997]"
                    : "border-[#E6E4DD] dark:border-[#303438] text-[#74777C] dark:text-[#A0A4A7]"
                }`}
              >
                {sub.name} ({sub.lang.toUpperCase()})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#E6E4DD]/70 dark:border-[#303438]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#74777C] dark:text-[#A0A4A7]">
          {activeTab === "video" && currentSelectedFormat && (
            <span>
              Target: {currentSelectedFormat.qualityLabel || currentSelectedFormat.resolution} • {currentSelectedFormat.ext.toUpperCase()}
            </span>
          )}
          {activeTab === "audio" && (
            <span>Target: {selectedAudioCodec.toUpperCase()} Extracted Audio</span>
          )}
        </div>

        <Button
          onClick={handleDownloadClick}
          disabled={isSubmitting}
          className="h-11 px-6 text-sm font-medium gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Queuing Download...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>
                {activeTab === "video" ? "Download Selected Format" : "Extract Audio File"}
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
