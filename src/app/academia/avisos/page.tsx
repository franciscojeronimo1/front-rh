"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckCheck, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  getGymNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type GymNotification,
  type PaginationInfo,
} from "@/lib/api"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { NotificationItem } from "@/components/academia/notification-item"
import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/academia/notification-bell"
import { whatsappLink } from "@/lib/academia/format"
import { cn } from "@/lib/utils"

export default function AvisosPage() {
  const [items, setItems] = useState<GymNotification[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getGymNotifications({ unreadOnly, page, limit: 20 })
      setItems(res.notifications)
      setPagination(res.pagination)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar avisos")
    } finally {
      setLoading(false)
    }
  }, [unreadOnly, page])

  useEffect(() => {
    void load()
  }, [load])

  const markOne = async (n: GymNotification) => {
    if (n.readAt) return
    await markNotificationRead(n.id).catch(() => {})
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)))
    setUnreadCount((c) => Math.max(0, c - 1))
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
  }

  const markAll = async () => {
    await markAllNotificationsRead().catch(() => {})
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
    toast.success("Todos os avisos foram marcados como lidos")
    void load()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <AcademiaPageHeader
          title="Avisos"
          subtitle="Tudo o que o sistema fez sozinho e o que merece sua atenção."
          actions={
            unreadCount > 0 ? (
              <Button variant="outline" onClick={markAll}>
                <CheckCheck className="mr-2 h-4 w-4" /> Marcar todos como lidos
              </Button>
            ) : undefined
          }
        />

        <div className="flex gap-2">
          {[
            { v: false, label: "Todos" },
            { v: true, label: `Não lidos (${unreadCount})` },
          ].map((f) => (
            <button
              key={String(f.v)}
              type="button"
              onClick={() => {
                setUnreadOnly(f.v)
                setPage(1)
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                unreadOnly === f.v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={1} />
        ) : items.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {unreadOnly ? "Nenhum aviso não lido. Tudo em dia! ✅" : "Nenhum aviso ainda."}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="divide-y p-2">
              {items.map((n) => (
                <div key={n.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <NotificationItem notification={n} onClick={() => markOne(n)} />
                  </div>
                  {n.member?.phone && whatsappLink(n.member.phone, n.member.name) && (n.type === "MEMBER_AT_RISK" || n.type === "PLAN_EXPIRING" || n.type === "PLAN_EXPIRED") && (
                    <Button asChild variant="ghost" size="icon" className="mt-3 shrink-0 text-emerald-700" title="Chamar no WhatsApp">
                      <a
                        href={whatsappLink(n.member.phone, n.member.name, n.type === "MEMBER_AT_RISK" ? "miss" : "plan") ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markOne(n)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
