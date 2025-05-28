"use client"

import { useEffect } from "react"
import { Moon, Sun } from "lucide-react"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setTheme } from "@/lib/redux/slices/themeSlice"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const dispatch = useAppDispatch()
  const themeMode = useAppSelector((state) => state.theme.mode)

  // Update the theme when the component mounts and when the theme changes
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (themeMode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(themeMode)
    }
  }, [themeMode])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => dispatch(setTheme("light"))}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => dispatch(setTheme("dark"))}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => dispatch(setTheme("system"))}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
