"use client"

import React, { useEffect, useState } from "react"
import { useThemeStore } from "@/stores/theme-store"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme, initTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initTheme()
    setMounted(true)
  }, [initTheme])

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        toggleTheme()
      }}
      type="button"
      aria-label="Toggle theme"
      title={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-[#191C1F] border border-[#E6E4DD] dark:border-[#303438] text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0] hover:bg-[#F5F4F0] dark:hover:bg-[#23272B] transition-colors cursor-pointer"
    >
      {mounted && theme === "dark" ? (
        <Sun className="w-4 h-4 text-[#8BA997]" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
