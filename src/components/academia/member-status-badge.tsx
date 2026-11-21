import { cn } from "@/lib/utils"
import type { MemberStatus } from "@/lib/api"
import { MEMBER_STATUS_LABEL } from "@/lib/academia/format"

const STYLES: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  AT_RISK: "bg-amber-50 text-amber-800 ring-amber-600/30",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
}

const DOT: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-500",
  AT_RISK: "bg-amber-500",
  INACTIVE: "bg-slate-400",
}

export function MemberStatusBadge({ status, className }: { status: MemberStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        STYLES[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {MEMBER_STATUS_LABEL[status]}
    </span>
  )
}

export function ToneText({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "danger" | "none"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "text-sm",
        tone === "danger" && "font-medium text-red-600",
        tone === "warn" && "font-medium text-amber-700",
        tone === "ok" && "text-slate-700",
        tone === "none" && "text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}
