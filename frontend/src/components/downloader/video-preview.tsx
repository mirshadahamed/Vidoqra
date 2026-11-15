"use client"

import React from "react"
import { MediaMetadata } from "@/types/media"
import { formatDuration } from "@/lib/utils"
import { Clock, Film, User, Eye, Check } from "lucide-react"

interface VideoPreviewProps {
  metadata: MediaMetadata
}

export function VideoPreview({ metadata }: VideoPreviewProps) {
  return (
    <div className="rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
      {/* Large Cinematic Video Thumbnail */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#17191C] border border-[#E6E4DD] dark:border-[#303438] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {metadata.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#74777C] gap-2">
            <Film className="w-10 h-10 opacity-30" />
            <span className="text-[11px] font-mono">No Preview</span>
          </div>
        )}

        {/* Video Duration Badge */}
        {metadata.duration !== undefined && metadata.duration > 0 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{formatDuration(metadata.duration)}</span>
          </div>
        )}

        {/* Platform Label */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded bg-white/90 dark:bg-[#111315]/90 backdrop-blur-sm text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD]/60 dark:border-[#303438]/60 text-[10px] font-mono uppercase tracking-wide">
            {metadata.platform.name}
          </span>
        </div>
      </div>

      {/* Video Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997] text-[10px] font-mono font-medium">
            <Check className="w-3 h-3" />
            Authentic Media
          </span>
          {metadata.videoFormats.length > 0 && (
            <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7]">
              {metadata.videoFormats.length} Streams
            </span>
          )}
        </div>

        <h3 className="font-serif text-xl sm:text-2xl text-[#17191C] dark:text-[#F4F4F0] leading-snug">
          {metadata.title}
        </h3>

        {metadata.uploader && (
          <div className="flex items-center gap-2 text-xs text-[#74777C] dark:text-[#A0A4A7] font-sans">
            <User className="w-3.5 h-3.5" />
            <span>{metadata.uploader}</span>
            {metadata.viewCount !== undefined && metadata.viewCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {metadata.viewCount.toLocaleString()}
                </span>
              </>
            )}
          </div>
        )}

        {/* Source URL & Security Status */}
        <div className="pt-3 border-t border-[#E6E4DD]/70 dark:border-[#303438]/70 text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] flex items-center justify-between gap-2">
          <span>Range Verified</span>
          <span className="truncate max-w-[200px]">{metadata.sourceUrl}</span>
        </div>
      </div>
    </div>
  )
}
