"use client"

import React from "react"
import Link from "next/link"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export function Logo({ className = "", size = "md", showTagline = false }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  }

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group focus:outline-none select-none ${className}`}
    >
      {/* Minimalist Precision Geometric Icon */}
      <div
        className={`${iconSizes[size]} flex items-center justify-center rounded-lg bg-[#17191C] dark:bg-[#F4F4F0] text-white dark:text-[#111315] transition-transform duration-200 group-hover:scale-[1.02]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
        >
          {/* Minimalist precision play-download aperture */}
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M10 8.5L15.5 12L10 15.5V8.5Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-sans font-semibold tracking-[-0.03em] text-[#17191C] dark:text-[#F4F4F0] ${textSizes[size]}`}
        >
          Vidoqra
        </span>
        {showTagline && (
          <span className="text-[11px] font-mono tracking-tight text-[#74777C] dark:text-[#A0A4A7] -mt-0.5">
            Your media. Simplified.
          </span>
        )}
      </div>
    </Link>
  )
}
