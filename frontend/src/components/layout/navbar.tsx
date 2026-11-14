"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"
import { useDownloads } from "@/hooks/use-downloads"
import { Settings as SettingsIcon, Menu, X } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { activeCount } = useDownloads()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Downloader", href: "/dashboard" },
    { 
      label: "Downloads", 
      href: "/downloads",
      badge: activeCount > 0 ? activeCount : null
    },
    { label: "History", href: "/history" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E6E4DD] dark:border-[#303438] bg-[#F5F4F0]/90 dark:bg-[#111315]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Minimal Wordmark */}
        <Logo size="sm" />

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/60 dark:bg-[#191C1F]/60 px-2 py-1 rounded-full border border-[#E6E4DD]/80 dark:border-[#303438]/80 text-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1 rounded-full transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white dark:bg-[#23272B] text-[#17191C] dark:text-[#F4F4F0] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#526F61] text-white dark:bg-[#8BA997] dark:text-[#111315]">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Theme Toggle & Settings */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          <div className="h-4 w-[1px] bg-[#E6E4DD] dark:bg-[#303438]" />

          <Link
            href="/settings"
            title="Settings & Specifications"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-transparent transition-colors ${
              pathname === "/settings"
                ? "bg-white dark:bg-[#191C1F] border-[#E6E4DD] dark:border-[#303438] text-[#17191C] dark:text-[#F4F4F0]"
                : "text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0]"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-[#E6E4DD] dark:border-[#303438] text-[#17191C] dark:text-[#F4F4F0]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E6E4DD] dark:border-[#303438] bg-[#F5F4F0] dark:bg-[#111315] px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438]"
                  : "text-[#74777C] dark:text-[#A0A4A7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{link.label}</span>
                {link.badge && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#526F61] text-white">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/settings"
                ? "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438]"
                : "text-[#74777C] dark:text-[#A0A4A7]"
            }`}
          >
            Settings
          </Link>
        </div>
      )}
    </header>
  )
}
