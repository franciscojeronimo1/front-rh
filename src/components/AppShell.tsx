"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Toaster } from "sonner"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed"

const ROUTES_WITH_SIDEBAR = ["/dashboard", "/ponto", "/colaboradores", "/estoque", "/administracao"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
        setCollapsed(stored === "true")
      }
    })
  }, [])

  const showSidebar =
    mounted &&
    ROUTES_WITH_SIDEBAR.some((route) => pathname === route || pathname.startsWith(route + "/"))

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false))
  }, [pathname])

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      }
      return next
    })
  }

  if (!showSidebar) {
    return (
      <>
        <Toaster richColors closeButton position="top-right" />
        {children}
      </>
    )
  }

  return (
    <>
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - mobile (drawer) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Sistema CGS</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
    <Toaster richColors closeButton position="top-right" />
    </>
  )
}
