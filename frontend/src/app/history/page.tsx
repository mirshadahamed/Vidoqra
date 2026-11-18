"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useDownloads } from "@/hooks/use-downloads"
import { api } from "@/services/api"
import { formatBytes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Trash2, 
  Download, 
  Film, 
  ArrowUpDown, 
  Calendar,
  Compass 
} from "lucide-react"

export default function HistoryPage() {
  const { history, deleteHistory } = useDownloads()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "size">("newest")

  const filteredHistory = useMemo(() => {
    let result = history.filter((item) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        item.title.toLowerCase().includes(term) ||
        item.sourceName.toLowerCase().includes(term) ||
        item.format.toLowerCase().includes(term) ||
        item.quality.toLowerCase().includes(term)
      )
    })

    if (sortOrder === "newest") {
      result = [...result].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    } else if (sortOrder === "oldest") {
      result = [...result].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    } else if (sortOrder === "size") {
      result = [...result].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    }

    return result
  }, [history, searchTerm, sortOrder])

  const handleDownloadAgain = (item: typeof history[0]) => {
    const url = api.getFileDownloadUrl(item.jobId, item.downloadToken)
    window.open(url, "_blank")
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
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block mb-1">
                Archives
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#17191C] dark:text-[#F4F4F0]">
                Download History
              </h1>
              <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] mt-1">
                Past media downloads, generated formats, and permanent file access tokens.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#74777C] dark:text-[#A0A4A7]" />
                <input
                  type="text"
                  placeholder="Filter history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F4F0] placeholder:text-[#74777C] dark:placeholder:text-[#A0A4A7] focus:outline-none focus:border-[#526F61] dark:focus:border-[#8BA997] transition-colors"
                />
              </div>

              {/* Sort Switcher */}
              <button
                type="button"
                onClick={() => {
                  if (sortOrder === "newest") setSortOrder("size")
                  else if (sortOrder === "size") setSortOrder("oldest")
                  else setSortOrder("newest")
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E4DD] dark:border-[#303438] text-xs font-mono bg-[#F5F4F0] dark:bg-[#111315] text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0] transition-colors"
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="capitalize">{sortOrder}</span>
              </button>
            </div>
          </div>

          {/* Clean Table / List Layout */}
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl bg-white dark:bg-[#191C1F] border border-[#E6E4DD] dark:border-[#303438] space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] flex items-center justify-center text-[#74777C]">
                <Compass className="w-5 h-5 opacity-60" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-[#17191C] dark:text-[#F4F4F0]">
                  No history records
                </h4>
                <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] max-w-sm mt-1">
                  {searchTerm
                    ? "No completed media items match your search term."
                    : "Completed media downloads will be organized and preserved here."}
                </p>
              </div>
              <Link href="/dashboard">
                <Button size="sm" variant="secondary" className="gap-1.5 text-xs mt-2">
                  <span>Start a Download</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="divide-y divide-[#E6E4DD]/70 dark:divide-[#303438]/70">
                {filteredHistory.map((item) => (
                  <div
                    key={item.downloadId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#FAF9F6] dark:hover:bg-[#202428] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] flex items-center justify-center text-[#74777C] shrink-0">
                        <Film className="w-4 h-4 opacity-70" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#17191C] dark:text-[#F4F4F0] truncate">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#74777C] dark:text-[#A0A4A7]">
                          <span className="px-1.5 py-0.2 rounded bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] text-[10px] uppercase">
                            {item.sourceName}
                          </span>
                          <span>
                            {item.quality} • {item.format.toUpperCase()}
                          </span>
                          {item.fileSize && (
                            <span>• {formatBytes(item.fileSize)}</span>
                          )}
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 opacity-60" />
                            {new Date(item.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadAgain(item)}
                        className="text-xs h-8 px-3 gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHistory(item.downloadId)}
                        className="text-[#74777C] hover:text-rose-500 h-8 w-8"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
