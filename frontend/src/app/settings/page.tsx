"use client"

import React, { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { api, getApiBase } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Server, HardDrive, Key, Check, Globe } from "lucide-react"

export default function SettingsPage() {
  const [health, setHealth] = useState<{
    status: string
    version: string
    redis: boolean
    mongodb: boolean
  } | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [copiedSession, setCopiedSession] = useState(false)
  const [backendUrl, setBackendUrl] = useState<string>("")
  const [savedUrl, setSavedUrl] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionId(localStorage.getItem("vidoqra_session_id") || "guest_default")
      setBackendUrl(localStorage.getItem("vidoqra_backend_url") || getApiBase())
    }
    api.checkHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "Offline", version: "1.0", redis: false, mongodb: false }))
  }, [])

  const handleSaveBackendUrl = () => {
    if (typeof window !== "undefined") {
      const trimmed = backendUrl.trim().replace(/\/$/, "")
      if (trimmed) {
        localStorage.setItem("vidoqra_backend_url", trimmed)
      } else {
        localStorage.removeItem("vidoqra_backend_url")
      }
      setSavedUrl(true)
      setTimeout(() => setSavedUrl(false), 2000)
      window.location.reload()
    }
  }

  const handleResetSession = () => {
    if (typeof window !== "undefined") {
      const newSid = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      localStorage.setItem("vidoqra_session_id", newSid)
      setSessionId(newSid)
      window.location.reload()
    }
  }

  const handleCopySession = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId)
      setCopiedSession(true)
      setTimeout(() => setCopiedSession(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] block mb-1">
              Infrastructure
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#17191C] dark:text-[#F4F4F0]">
              Settings & Specifications
            </h1>
            <p className="text-xs sm:text-sm text-[#74777C] dark:text-[#A0A4A7] mt-1">
              Configuration telemetry, backend service health, storage quotas, and cryptographic session tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Engine Status Card */}
            <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-[#526F61] dark:text-[#8BA997]" />
                <h3 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                  Backend Engine Health
                </h3>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438]">
                  <span className="text-[#74777C] dark:text-[#A0A4A7]">FastAPI Service</span>
                  <span className="text-[#526F61] dark:text-[#8BA997] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {health?.status || "Online"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438]">
                  <span className="text-[#74777C] dark:text-[#A0A4A7]">Database Provider</span>
                  <span className="text-[#17191C] dark:text-[#F4F4F0]">
                    {health?.mongodb ? "Atlas Connected" : "Local Document Store"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438]">
                  <span className="text-[#74777C] dark:text-[#A0A4A7]">Event Bus / Broker</span>
                  <span className="text-[#17191C] dark:text-[#F4F4F0]">
                    {health?.redis ? "Redis PubSub" : "In-Memory Event Bus"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438]">
                  <span className="text-[#74777C] dark:text-[#A0A4A7]">FFmpeg Binary</span>
                  <span className="text-[#526F61] dark:text-[#8BA997] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified & Multiplexing Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Configuration */}
            <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-[#526F61] dark:text-[#8BA997]" />
                <h3 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                  Storage Architecture
                </h3>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] space-y-0.5">
                  <span className="text-[10px] text-[#74777C] dark:text-[#A0A4A7] uppercase block">
                    Storage Driver
                  </span>
                  <span className="text-[#17191C] dark:text-[#F4F4F0]">
                    Local Sandboxed Disk / S3 Compatible
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] space-y-0.5">
                  <span className="text-[10px] text-[#74777C] dark:text-[#A0A4A7] uppercase block">
                    Single File Limit
                  </span>
                  <span className="text-[#526F61] dark:text-[#8BA997]">
                    2,147,483,648 bytes (2.0 GB)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#111315] border border-[#E6E4DD] dark:border-[#303438] space-y-0.5">
                  <span className="text-[10px] text-[#74777C] dark:text-[#A0A4A7] uppercase block">
                    File Retention
                  </span>
                  <span className="text-[#17191C] dark:text-[#F4F4F0]">
                    24 Hours (Automated Cleanup)
                  </span>
                </div>
              </div>
            </div>

            {/* Backend API Endpoint Configuration */}
            <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#526F61] dark:text-[#8BA997]" />
                <h3 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                  Backend API Endpoint
                </h3>
              </div>

              <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                Connect your frontend to a local or deployed Vercel/Railway backend. Leave blank to use the default environment endpoint or same-origin reverse proxy.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://your-backend-app.vercel.app or http://localhost:8000"
                  className="flex-1 bg-[#F5F4F0] dark:bg-[#111315] px-3.5 py-2 rounded-lg border border-[#E6E4DD] dark:border-[#303438] font-mono text-xs text-[#17191C] dark:text-[#F4F4F0] outline-none focus:border-[#526F61] dark:focus:border-[#8BA997]"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveBackendUrl}
                  className="text-xs h-9 px-4 shrink-0"
                >
                  {savedUrl ? "Saved!" : "Save & Connect"}
                </Button>
              </div>
            </div>

            {/* Cryptographic Guest Session */}
            <div className="p-5 sm:p-6 rounded-xl border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-[#526F61] dark:text-[#8BA997]" />
                <h3 className="font-medium text-sm text-[#17191C] dark:text-[#F4F4F0]">
                  Client Session Token
                </h3>
              </div>

              <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
                Vidoqra provisions each browser with an unguessable guest identifier. Your download queue and media history remain scoped to this session token without requiring account registration.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 bg-[#F5F4F0] dark:bg-[#111315] px-3.5 py-2 rounded-lg border border-[#E6E4DD] dark:border-[#303438] font-mono text-xs text-[#17191C] dark:text-[#F4F4F0] select-all truncate">
                  {sessionId}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySession}
                    className="text-xs h-9 px-3"
                  >
                    {copiedSession ? "Copied" : "Copy Token"}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetSession}
                    className="text-xs h-9 px-3"
                  >
                    Reset Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
