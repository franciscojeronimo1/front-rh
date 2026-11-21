"use client"

import { AlertTriangle, CalendarClock, CalendarX2, PartyPopper, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GymNotification, GymNotificationType } from "@/lib/api"
import { formatRelative } from "@/lib/academia/format"

const ICONS: Record<GymNotificationType, { icon: typeof AlertTriangle; className: string }> = {
  MEMBER_AT_RISK: { icon: AlertTriangle, className: "bg-amber-100 text-amber-700" },
  MEMBER_DEACTIVATED: { icon: UserX, className: "bg-slate-200 text-slate-700" },
  MEMBER_REACTIVATED: { icon: PartyPopper, className: "bg-emerald-100 text-emerald-700" },
  PLAN_EXPIRING: { icon: CalendarClock, className: "bg-blue-100 text-blue-700" },
  PLAN_EXPIRED: { icon: CalendarX2, className: "bg-red-100 text-red-700" },
}

export function NotificationItem({
  notification,
  compact,
  onClick,
}: {
  notification: GymNotification
  compact?: boolean
  onClick?: () => void
}) {
  const { icon: Icon, className } = ICONS[notification.type] ?? ICONS.MEMBER_AT_RISK
  const unread = !notification.readAt
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/60",
        unread && "bg-primary/5"
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", className)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn("text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>
            {notification.title}
          </span>
          {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Não lido" />}
        </span>
        <span className={cn("mt-0.5 block text-xs text-muted-foreground", compact && "line-clamp-2")}>
          {notification.message}
        </span>
        <span className="mt-1 block text-[11px] text-muted-foreground/80">{formatRelative(notification.createdAt)}</span>
      </span>
    </button>
  )
}
