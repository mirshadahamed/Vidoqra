"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Compass, 
  Download, 
  Clock, 
  Sliders, 
  ShieldCheck 
} from "lucide-react"
import { useDownloads } from "@/hooks/use-downloads"

export function Sidebar() {
  const pathname = usePathname()
  const { activeCount } = useDownloads()

  const navItems = [
    {
      title: "Downloader",
      href: "/dashboard",
      icon: Compass,
      active: pathname === "/dashboard",
    },
    {
      title: "Downloads",
      href: "/downloads",
      icon: Download,
      active: pathname === "/downloads",
      badge: activeCount > 0 ? activeCount : null,
    },
    {
      title: "History",
      href: "/history",
      icon: Clock,
      active: pathname === "/history",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Sliders,
      active: pathname === "/settings",
    },
  ]

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col justify-between border-r border-[#E6E4DD] dark:border-[#303438] bg-[#F5F4F0] dark:bg-[#111315] p-4 min-h-[calc(100vh-3.5rem)] transition-colors duration-200">
      <div className="space-y-4">
        <div>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] px-2 mb-2 block">
            Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors duration-150 ${
                    item.active
                      ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] font-medium border border-[#E6E4DD] dark:border-[#303438] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0] hover:bg-white/60 dark:hover:bg-[#191C1F]/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#526F61] text-white dark:bg-[#8BA997] dark:text-[#111315]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Subtle specs callout */}
      <div className="p-3 rounded-lg border border-[#E6E4DD] dark:border-[#303438] bg-white/50 dark:bg-[#191C1F]/50 text-[11px] text-[#74777C] dark:text-[#A0A4A7] space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-[#17191C] dark:text-[#F4F4F0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#526F61] dark:text-[#8BA997]" />
          <span>SSRF Protected</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#74777C] dark:text-[#A0A4A7]">
          Sandboxed range requests & verified streams.
        </p>
      </div>
    </aside>
  )
}
