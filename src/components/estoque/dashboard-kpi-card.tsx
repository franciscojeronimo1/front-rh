"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { estoqueDashboardLayout } from "@/lib/estoque/dashboard-tokens"
import { MiniSparkline } from "./mini-sparkline"
import type { TrendDelta } from "@/lib/estoque/dashboard-types"

export type DashboardKpiCardProps = {
  label: string
  icon: ReactNode
  iconSurfaceClassName: string
  value: ReactNode
  valueClassName?: string
  caption: string
  trend?: TrendDelta | null
  sparklineValues: number[]
  sparklineStroke: string
  sparklineLineOnly?: boolean
}

export function DashboardKpiCard({
  label,
  icon,
  iconSurfaceClassName,
  value,
  valueClassName = "text-slate-900",
  caption,
  trend,
  sparklineValues,
  sparklineStroke,
  sparklineLineOnly,
}: DashboardKpiCardProps) {
  return (
    <Card className={`overflow-hidden ${estoqueDashboardLayout.card}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconSurfaceClassName}`}
          >
            {icon}
          </div>
        </div>
        <p className={`mt-2 text-2xl font-bold tracking-tight md:text-3xl ${valueClassName}`}>{value}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">{caption}</p>
            {trend && (
              <p
                className={`mt-1 text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"}`}
              >
                {trend.text} vs semana anterior
              </p>
            )}
          </div>
          <MiniSparkline values={sparklineValues} stroke={sparklineStroke} lineOnly={sparklineLineOnly} />
        </div>
      </CardContent>
    </Card>
  )
}
