"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useDownloadStore } from "@/stores/download-store"
import { api } from "@/services/api"
import { 
  Clipboard, 
  Loader2, 
  AlertCircle, 
  X, 
  ArrowRight,
  Link as LinkIcon
} from "lucide-react"

const urlSchema = z.object({
  url: z.string().url("Please enter a valid HTTP or HTTPS media URL"),
})

type UrlFormData = z.infer<typeof urlSchema>

interface UrlInputProps {
  onAnalyzed?: () => void
}

export function UrlInput({ onAnalyzed }: UrlInputProps) {
  const { 
    isAnalyzing, 
    analysisError, 
    setAnalyzing, 
    setAnalysisResult, 
    setAnalysisError,
    clearAnalysis 
  } = useDownloadStore()

  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  })

  const currentUrl = watch("url")

  // Platform detection preview
  useEffect(() => {
    if (!currentUrl) {
      setDetectedPlatform(null)
      return
    }
    const lower = currentUrl.toLowerCase()
    if (lower.includes("archive.org")) {
      setDetectedPlatform("Internet Archive")
    } else if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      setDetectedPlatform("YouTube (Authorized)")
    } else if (/\.(mp4|webm|mkv|mov|m4a|mp3)(\?.*)?$/i.test(lower)) {
      setDetectedPlatform("Direct Media Stream")
    } else {
      setDetectedPlatform("Web Stream")
    }
  }, [currentUrl])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setValue("url", text.trim(), { shouldValidate: true })
      }
    } catch {
      // Clipboard access unavailable
    }
  }

  const handleClear = () => {
    setValue("url", "")
    clearAnalysis()
    setDetectedPlatform(null)
  }

  const onSubmit = async (data: UrlFormData) => {
    setAnalyzing(true, data.url)
    try {
      const metadata = await api.analyzeUrl(data.url)
      setAnalysisResult(metadata)
      if (onAnalyzed) onAnalyzed()
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : "Failed to analyze media URL"
      if (message.toLowerCase().includes("failed to fetch")) {
        message = "Could not reach the backend service. Check Settings to set your backend URL or ensure your backend is deployed."
      }
      setAnalysisError(message)
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Main Elevated Input Container */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] p-2 sm:p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] focus-within:border-[#526F61] dark:focus-within:border-[#8BA997] focus-within:ring-1 focus-within:ring-[#526F61] dark:focus-within:ring-[#8BA997] transition-all"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Input field with icon */}
          <div className="relative flex-1 flex items-center min-w-0">
            <LinkIcon className="w-4 h-4 ml-3 mr-2 shrink-0 text-[#74777C] dark:text-[#A0A4A7]" />
            <input
              {...register("url")}
              type="text"
              placeholder="Paste media link (YouTube, Archive.org, or direct MP4/MP3)..."
              disabled={isAnalyzing}
              autoComplete="off"
              spellCheck="false"
              className="w-full bg-transparent px-1 py-2 text-sm text-[#17191C] dark:text-[#F4F4F0] placeholder:text-[#74777C] dark:placeholder:text-[#A0A4A7] focus:outline-none disabled:opacity-50"
            />

            {/* Clear Button */}
            {currentUrl && !isAnalyzing && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 mr-1 rounded-md text-[#74777C] hover:text-[#17191C] dark:hover:text-[#F4F4F0] hover:bg-[#F5F4F0] dark:hover:bg-[#23272B] transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E4DD]/60 dark:border-[#303438]/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              disabled={isAnalyzing}
              className="text-xs h-9 px-3 gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </Button>

            <Button
              type="submit"
              disabled={isAnalyzing}
              className="h-9 px-4 text-xs font-medium gap-1.5 min-w-[96px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Subtle telemetry / platform status row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#74777C] dark:text-[#A0A4A7]">
        <div className="flex items-center gap-2">
          {detectedPlatform ? (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#526F61] dark:bg-[#8BA997]" />
              <span className="text-[#17191C] dark:text-[#F4F4F0]">{detectedPlatform}</span>
            </div>
          ) : (
            <span className="font-mono text-[11px]">Direct Range & Adaptive Stream Inspector</span>
          )}
        </div>

        {/* Quick sample link chip */}
        <button
          type="button"
          onClick={() => setValue("url", "https://archive.org/details/test_video", { shouldValidate: true })}
          className="font-mono text-[11px] text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0] underline underline-offset-2 transition-colors cursor-pointer"
        >
          Sample: Archive.org public stream
        </button>
      </div>

      {/* Validation or Error messages */}
      {(errors.url || analysisError) && (
        <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errors.url?.message || analysisError}</span>
        </div>
      )}

      {/* Elegant Skeleton State while analyzing */}
      {isAnalyzing && (
        <div className="mt-6 p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-4 animate-pulse">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 aspect-video bg-[#E6E4DD]/60 dark:bg-[#303438]/60 rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-[#E6E4DD]/60 dark:bg-[#303438]/60 rounded w-3/4" />
              <div className="h-3 bg-[#E6E4DD]/40 dark:bg-[#303438]/40 rounded w-1/2" />
              <div className="h-3 bg-[#E6E4DD]/40 dark:bg-[#303438]/40 rounded w-1/3" />
              <div className="pt-4 flex gap-2">
                <div className="h-7 w-20 bg-[#E6E4DD]/50 dark:bg-[#303438]/50 rounded-md" />
                <div className="h-7 w-20 bg-[#E6E4DD]/50 dark:bg-[#303438]/50 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
