"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { DownloadList } from "@/components/downloads/download-list"
import { useDownloads } from "@/hooks/use-downloads"
import { useJobWebSocket } from "@/hooks/use-websocket"
import { Button } from "@/components/ui/button"
import { RotateCw, Plus, Wifi, WifiOff } from "lucide-react"

export default function DownloadsPage() {
  const { jobs, refreshJobs } = useDownloads()
  const { isConnected } = useJobWebSocket()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshJobs()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl text-[#17191C] dark:text-[#F4F4F0]">
                  Download Manager
                </h1>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997]">
                    <Wifi className="w-3 h-3" />
                    LIVE WS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-[#74777C] dark:text-[#A0A4A7] bg-[#F5F4F0] dark:bg-[#111315]">
                    <WifiOff className="w-3 h-3" />
                    POLLING
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] mt-1">
                Real-time queue monitoring, background FFmpeg processing, and direct file delivery.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs h-9 px-3"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 text-xs h-9 px-3">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Download</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Job List */}
          <DownloadList jobs={jobs} />
        </main>
      </div>
    </div>
  )
}
