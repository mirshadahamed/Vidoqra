"use client"

import React, { useRef, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { UrlInput } from "@/components/downloader/url-input"
import { VideoPreview } from "@/components/downloader/video-preview"
import { FormatSelector } from "@/components/downloader/format-selector"
import { DownloadCard } from "@/components/downloads/download-card"
import { useDownloadStore } from "@/stores/download-store"
import { useDownloads } from "@/hooks/use-downloads"
import { useJobWebSocket } from "@/hooks/use-websocket"
import { 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  DownloadCloud, 
  Clock, 
  HardDrive 
} from "lucide-react"

export default function DashboardPage() {
  useJobWebSocket() // Global real-time stream for all jobs
  const { currentMetadata } = useDownloadStore()
  const { jobs, activeCount, history, startDownload } = useDownloads()
  const [downloadStarting, setDownloadStarting] = useState(false)
  const analysisRef = useRef<HTMLDivElement>(null)

  const handleStartDownload = async (options: {
    formatId: string
    selectedFormat: string
    selectedQuality: string
    extractAudioOnly?: boolean
    selectedSubtitle?: string
  }) => {
    if (!currentMetadata) return
    setDownloadStarting(true)
    try {
      await startDownload({
        sourceUrl: currentMetadata.sourceUrl,
        formatId: options.formatId,
        selectedFormat: options.selectedFormat,
        selectedQuality: options.selectedQuality,
        title: currentMetadata.title,
        thumbnail: currentMetadata.thumbnail,
        extractAudioOnly: options.extractAudioOnly,
        selectedSubtitle: options.selectedSubtitle,
      })
      window.location.href = "/downloads"
    } finally {
      setDownloadStarting(false)
    }
  }

  // Active or most recent jobs for preview
  const recentJobs = jobs.slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block mb-1">
                Workspace
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#17191C] dark:text-[#F4F4F0]">
                Media Downloader
              </h1>
              <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] mt-1">
                Inspect authentic streams, select target quality, and trigger background downloads.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] text-xs font-mono text-[#526F61] dark:text-[#8BA997]">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSRF Guarded
              </span>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-1">
              <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] flex items-center gap-1.5 uppercase">
                <Activity className="w-3 h-3 text-[#526F61] dark:text-[#8BA997]" />
                Active Queue
              </span>
              <div className="text-2xl font-mono font-medium text-[#17191C] dark:text-[#F4F4F0]">
                {activeCount}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-1">
              <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] flex items-center gap-1.5 uppercase">
                <DownloadCloud className="w-3 h-3 text-[#A6B4C2]" />
                Total Jobs
              </span>
              <div className="text-2xl font-mono font-medium text-[#17191C] dark:text-[#F4F4F0]">
                {jobs.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-1">
              <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] flex items-center gap-1.5 uppercase">
                <Clock className="w-3 h-3 text-[#74777C]" />
                History Items
              </span>
              <div className="text-2xl font-mono font-medium text-[#17191C] dark:text-[#F4F4F0]">
                {history.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-1">
              <span className="text-[11px] font-mono text-[#74777C] dark:text-[#A0A4A7] flex items-center gap-1.5 uppercase">
                <HardDrive className="w-3 h-3 text-[#526F61] dark:text-[#8BA997]" />
                Engine Storage
              </span>
              <div className="text-xs font-mono font-medium text-[#17191C] dark:text-[#F4F4F0] pt-1.5">
                Local / S3
              </div>
            </div>
          </div>

          {/* URL Input Box */}
          <div ref={analysisRef} className="space-y-6">
            <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
              <div className="space-y-1">
                <h2 className="font-serif text-lg text-[#17191C] dark:text-[#F4F4F0]">
                  Inspect Media Link
                </h2>
                <p className="text-xs text-[#74777C] dark:text-[#A0A4A7]">
                  Enter any direct media link, Archive.org URL, or authorized media stream.
                </p>
              </div>

              <UrlInput
                onAnalyzed={() => {
                  if (analysisRef.current) {
                    analysisRef.current.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              />
            </div>

            {/* Analysis result preview & format picker in asymmetric 2-column layout */}
            {currentMetadata && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                <div className="lg:col-span-5">
                  <VideoPreview metadata={currentMetadata} />
                </div>
                <div className="lg:col-span-7">
                  <FormatSelector
                    metadata={currentMetadata}
                    onSelectFormat={handleStartDownload}
                    isSubmitting={downloadStarting}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recent Active Downloads section */}
          {recentJobs.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#17191C] dark:text-[#F4F4F0]">
                  Recent Downloads
                </h3>
                <Link
                  href="/downloads"
                  className="text-xs text-[#526F61] dark:text-[#8BA997] hover:underline flex items-center gap-1"
                >
                  View All Downloads ({jobs.length})
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <DownloadCard key={job.jobId} job={job} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
