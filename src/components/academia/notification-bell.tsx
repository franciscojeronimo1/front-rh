"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getGymNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type GymNotification,
} from "@/lib/api"
import { useGymModule } from "@/hooks/useGymModule"
import { NotificationItem } from "./notification-item"

const POLL_MS = 60_000
export const NOTIFICATIONS_CHANGED_EVENT = "gym-notifications-changed"

/** Sino de avisos da academia (contador de não lidos + últimos avisos). */
export function NotificationBell({ className }: { className?: string }) {
  const { enabled } = useGymModule()
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<GymNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      const { unreadCount } = await getUnreadNotificationsCount()
      setUnread(unreadCount)
    } catch {
      /* silencioso */
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refreshCount()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refreshCount()
    }, POLL_MS)
    const onChanged = () => void refreshCount()
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    return () => {
      clearInterval(id)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    }
  }, [enabled, refreshCount])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getGymNotifications({ limit: 8 })
      setItems(res.notifications)
      setUnread(res.unreadCount)
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }, [])

  if (!enabled) return null

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) void loadItems()
  }

  const handleItemClick = async (n: GymNotification) => {
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)))
      setUnread((u) => Math.max(0, u - 1))
      await markNotificationRead(n.id).catch(() => {})
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
    }
  }

  const handleReadAll = async () => {
    await markAllNotificationsRead().catch(() => {})
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })))
    setUnread(0)
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className ?? ""}`} aria-label="Avisos">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Avisos da academia</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} não lido${unread === 1 ? "" : "s"}` : "Tudo em dia"}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleReadAll}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todos
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {loading && items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum aviso ainda. O sistema avisa aqui quando um aluno sumir ou o plano vencer.
            </p>
          ) : (
            items.map((n) => (
              <NotificationItem key={n.id} notification={n} compact onClick={() => handleItemClick(n)} />
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
            <Link href="/academia/avisos">Ver todos os avisos</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
