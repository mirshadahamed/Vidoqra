"use client"

import { create } from "zustand"

export type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  initTheme: () => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const body = document.body

  if (theme === "dark") {
    root.classList.add("dark")
    root.setAttribute("data-theme", "dark")
    root.style.colorScheme = "dark"
    if (body) {
      body.classList.add("dark")
      body.setAttribute("data-theme", "dark")
    }
  } else {
    root.classList.remove("dark")
    root.setAttribute("data-theme", "light")
    root.style.colorScheme = "light"
    if (body) {
      body.classList.remove("dark")
      body.setAttribute("data-theme", "light")
    }
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  initTheme: () => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("vidoqra_theme") as Theme | null
    let currentTheme: Theme = "light"
    if (stored === "dark" || stored === "light") {
      currentTheme = stored
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      currentTheme = "dark"
    } else if (document.documentElement.classList.contains("dark")) {
      currentTheme = "dark"
    }
    applyTheme(currentTheme)
    set({ theme: currentTheme })
  },
  toggleTheme: () => {
    if (typeof document === "undefined") return
    const isCurrentlyDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark" ||
      get().theme === "dark"

    const nextTheme: Theme = isCurrentlyDark ? "light" : "dark"
    applyTheme(nextTheme)
    try {
      localStorage.setItem("vidoqra_theme", nextTheme)
    } catch {
      // Ignore storage errors in restricted contexts
    }
    set({ theme: nextTheme })
  },
  setTheme: (theme: Theme) => {
    applyTheme(theme)
    try {
      localStorage.setItem("vidoqra_theme", theme)
    } catch {
      // Ignore storage errors in restricted contexts
    }
    set({ theme })
  },
}))
