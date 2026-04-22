"use client"

import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export type EstoqueDashboardHeaderProps = {
  title: string
  subtitle: string
  onBack: () => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function EstoqueDashboardHeader({
  title,
  subtitle,
  onBack,
  onRefresh,
  isRefreshing,
}: EstoqueDashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="mt-1 h-10 w-10 shrink-0 rounded-xl border-slate-200 bg-white shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm capitalize text-slate-500 md:text-base">{subtitle}</p>
        </div>
      </div>
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2 rounded-xl bg-blue-600 px-5 text-white shadow-md hover:bg-blue-700"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Atualizar dados
      </Button>
    </div>
  )
}
