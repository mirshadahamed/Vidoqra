"use client"

import React, { useState } from "react"
import Link from "next/link"
import { DownloadJob } from "@/types/download"
import { DownloadCard } from "./download-card"
import { Button } from "@/components/ui/button"
import { Search, Compass, ArrowRight } from "lucide-react"

interface DownloadListProps {
  jobs: DownloadJob[]
}

export function DownloadList({ jobs }: DownloadListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "failed">("all")
  const [search, setSearch] = useState("")

  const filteredJobs = jobs.filter((job) => {
    // Search
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.sourceUrl.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Filter
    if (filter === "active") {
      return job.status === "Downloading" || job.status === "Processing" || job.status === "Queued" || job.status === "Analyzing"
    }
    if (filter === "completed") {
      return job.status === "Completed"
    }
    if (filter === "failed") {
      return job.status === "Failed" || job.status === "Cancelled"
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Filters and search header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#191C1F] border border-[#E6E4DD] dark:border-[#303438] text-xs">
          {(["all", "active", "completed", "failed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                filter === tab
                  ? "bg-[#526F61] text-white dark:bg-[#8BA997] dark:text-[#111315] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#74777C] dark:text-[#A0A4A7]" />
          <input
            type="text"
            placeholder="Search downloads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#191C1F] border border-[#E6E4DD] dark:border-[#303438] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F4F0] placeholder:text-[#74777C] dark:placeholder:text-[#A0A4A7] focus:outline-none focus:border-[#526F61] dark:focus:border-[#8BA997] transition-colors"
          />
        </div>
      </div>

      {/* List / Thoughtful Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-white dark:bg-[#191C1F] border border-[#E6E4DD] dark:border-[#303438] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] flex items-center justify-center text-[#74777C] dark:text-[#A0A4A7]">
            <Compass className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#17191C] dark:text-[#F4F4F0]">
              No downloads found
            </h4>
            <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] max-w-sm mt-1">
              {search || filter !== "all"
                ? "No media jobs match your active filter or search keywords."
                : "Active and completed downloads in this session will appear here."}
            </p>
          </div>
          <Link href="/dashboard">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs mt-2">
              <span>Inspect a Media URL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <DownloadCard key={job.jobId} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
