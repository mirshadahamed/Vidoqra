"use client"

import React from "react"
import Link from "next/link"
import { Logo } from "./logo"

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E6E4DD] dark:border-[#303438] bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Logo size="sm" showTagline />
            <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
              Quiet luxury media technology. Explore genuine streams and manage your authorized downloads with Swiss editorial clarity.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="text-[#17191C] dark:text-[#F4F4F0] hover:text-[#526F61] dark:hover:text-[#8BA997] transition-colors">
                  Media Downloader
                </Link>
              </li>
              <li>
                <Link href="/downloads" className="text-[#17191C] dark:text-[#F4F4F0] hover:text-[#526F61] dark:hover:text-[#8BA997] transition-colors">
                  Active Queue
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-[#17191C] dark:text-[#F4F4F0] hover:text-[#526F61] dark:hover:text-[#8BA997] transition-colors">
                  Archive & History
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-[#17191C] dark:text-[#F4F4F0] hover:text-[#526F61] dark:hover:text-[#8BA997] transition-colors">
                  System Specifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Sources */}
          <div>
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] mb-3">
              Supported Sources
            </h4>
            <ul className="space-y-2 text-xs text-[#74777C] dark:text-[#A0A4A7]">
              <li>Direct Video / Audio Links</li>
              <li>Internet Archive (archive.org)</li>
              <li>Authorized YouTube Streams</li>
              <li>FFmpeg Multiplexing</li>
            </ul>
          </div>

          {/* Compliance & Policy */}
          <div>
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#74777C] dark:text-[#A0A4A7] mb-3">
              Compliance
            </h4>
            <p className="text-xs text-[#74777C] dark:text-[#A0A4A7] leading-relaxed">
              Vidoqra strictly processes media you own or have explicit authorization to download. DRM circumvention is rejected by architectural design.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E6E4DD]/80 dark:border-[#303438]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#74777C] dark:text-[#A0A4A7]">
          <div>
            &copy; 2026 Vidoqra. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>SSRF Guard Active</span>
            <span>•</span>
            <span>Local & S3 Storage</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
