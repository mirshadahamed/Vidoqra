"use client"

import React, { useRef, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { UrlInput } from "@/components/downloader/url-input"
import { VideoPreview } from "@/components/downloader/video-preview"
import { FormatSelector } from "@/components/downloader/format-selector"
import { useDownloadStore } from "@/stores/download-store"
import { useDownloads } from "@/hooks/use-downloads"
import { 
  ChevronDown, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Check, 
  FileCheck, 
  Sliders, 
  DownloadCloud 
} from "lucide-react"

export default function LandingPage() {
  const { currentMetadata } = useDownloadStore()
  const { startDownload } = useDownloads()
  const [downloadStarting, setDownloadStarting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
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

  const faqs = [
    {
      q: "Which media sources are supported by Vidoqra?",
      a: "Vidoqra integrates directly with HTTP/HTTPS media URLs (MP4, WebM, M4A, etc.), Internet Archive (archive.org) historical collections, and authorized media platforms where download access is legally authorized. DRM-protected content is deliberately rejected.",
    },
    {
      q: "Does Vidoqra upscale lower quality videos?",
      a: "Never. Vidoqra adheres strictly to technical honesty: we only surface streams genuinely exposed by the upstream server. If the highest resolution available is 1080p, only authentic streams are listed.",
    },
    {
      q: "How does FFmpeg stream multiplexing operate?",
      a: "Modern streaming architectures split high-definition video from audio tracks. When an adaptive stream is selected, our background engine invokes FFmpeg to merge both tracks losslessly without recoding degradation.",
    },
    {
      q: "How are downloads secured against SSRF and unauthorized access?",
      a: "Every media link is validated against loopback, private IPv4/IPv6 ranges (RFC1918), and cloud metadata endpoints. Download jobs are provisioned with cryptographically unguessable one-time tokens.",
    },
    {
      q: "Can audio be extracted from video files?",
      a: "Yes. You can isolate audio tracks into MP3, AAC/M4A, or uncompressed WAV directly through the format selector.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* ===================== HERO SECTION ===================== */}
        <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#E6E4DD] dark:border-[#303438]">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Minimal Subtitle Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E6E4DD] dark:border-[#303438] bg-white/70 dark:bg-[#191C1F]/70 text-xs font-mono text-[#74777C] dark:text-[#A0A4A7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#526F61] dark:bg-[#8BA997]" />
              <span>Universal Media Formats • Direct Range Engine</span>
            </div>

            {/* Editorial Heading */}
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.02] text-[#17191C] dark:text-[#F4F4F0]">
              Everything you need.<br />
              <span className="italic text-[#74777C] dark:text-[#A0A4A7]">Nothing you don&apos;t.</span>
            </h1>

            {/* Supporting Description */}
            <p className="max-w-xl mx-auto text-base sm:text-lg text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
              A simpler way to explore available media formats and manage your downloads.
            </p>

            {/* Primary Interaction: URL Input */}
            <div ref={analysisRef} className="pt-6 max-w-2xl mx-auto text-left">
              <UrlInput
                onAnalyzed={() => {
                  if (analysisRef.current) {
                    analysisRef.current.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              />
            </div>

            {/* Asymmetric Two-Column Composition: Left Video Preview + Right Format Selector */}
            {currentMetadata && (
              <div className="pt-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left animate-in fade-in duration-300">
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
        </section>

        {/* ===================== EDITORIAL HIGHLIGHTS ===================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E6E4DD] dark:border-[#303438]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block mb-1">
                  Architecture
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#17191C] dark:text-[#F4F4F0]">
                  Calm, reliable media tools.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] max-w-md">
                Built with Swiss typographic restraint and production-grade media pipelines. No intrusive ads, zero fabricated quality tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-3">
                <span className="font-mono text-xs text-[#526F61] dark:text-[#8BA997] block">
                  01 / INSPECTION
                </span>
                <h3 className="font-serif text-xl text-[#17191C] dark:text-[#F4F4F0]">
                  Genuine Stream Detection
                </h3>
                <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  Real video streams and audio codecs directly probed from the source. Only genuine resolutions (4K, 1440p, 1080p, 720p) are listed.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-3">
                <span className="font-mono text-xs text-[#526F61] dark:text-[#8BA997] block">
                  02 / FIDELITY
                </span>
                <h3 className="font-serif text-xl text-[#17191C] dark:text-[#F4F4F0]">
                  Lossless FFmpeg Merging
                </h3>
                <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  Adaptive DASH and HLS video tracks are combined with audio streams using lossless container copy, retaining maximum fidelity.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-3">
                <span className="font-mono text-xs text-[#526F61] dark:text-[#8BA997] block">
                  03 / INTEGRITY
                </span>
                <h3 className="font-serif text-xl text-[#17191C] dark:text-[#F4F4F0]">
                  SSRF Defense & Privacy
                </h3>
                <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  Network validation blocks loopback, private subnets, and metadata endpoints. Download deliveries use single-use guest tokens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== SUPPORTED PLATFORMS ===================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E6E4DD] dark:border-[#303438] bg-white/40 dark:bg-[#191C1F]/40">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block">
                Source Integrations
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#17191C] dark:text-[#F4F4F0]">
                Honest, Tested & Authorized Adapters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-lg border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                    Direct Media URLs
                  </h4>
                  <span className="font-mono text-[10px] text-[#526F61] dark:text-[#8BA997]">
                    HTTP Range
                  </span>
                </div>
                <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  MP4, WebM, MKV, MP3, and M4A direct links with MIME verification and resumable downloading.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                    Internet Archive
                  </h4>
                  <span className="font-mono text-[10px] text-[#526F61] dark:text-[#8BA997]">
                    archive.org
                  </span>
                </div>
                <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  Metadata resolver for public domain and creative commons archival items with multiple bitrates.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                    Authorized Platforms
                  </h4>
                  <span className="font-mono text-[10px] text-[#526F61] dark:text-[#8BA997]">
                    YouTube Stream
                  </span>
                </div>
                <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                  yt-dlp adapter strictly enabled for media you own or have explicit permission to access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== FAQ SECTION ===================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block">
                Technical Clarity
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#17191C] dark:text-[#F4F4F0]">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-medium text-[#17191C] dark:text-[#F4F4F0] hover:text-[#526F61] dark:hover:text-[#8BA997] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#74777C] dark:text-[#A0A4A7] transition-transform duration-200 shrink-0 ml-4 ${
                        openFaq === idx ? "rotate-180 text-[#526F61] dark:text-[#8BA997]" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] leading-relaxed border-t border-[#E6E4DD]/60 dark:border-[#303438]/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
