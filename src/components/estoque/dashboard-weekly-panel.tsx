"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { estoqueDashboardLayout } from "@/lib/estoque/dashboard-tokens"
import type { WeekChartPoint } from "@/lib/estoque/dashboard-types"
import { WeeklyMovementsChart } from "./weekly-movements-chart"

export type DashboardWeeklyPanelProps = {
  data: WeekChartPoint[]
}

export function DashboardWeeklyPanel({ data }: DashboardWeeklyPanelProps) {
  return (
    <Card className={`${estoqueDashboardLayout.card} lg:col-span-3`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Movimentações da semana</CardTitle>
        <CardDescription>Entradas vs saídas — últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <WeeklyMovementsChart data={data} />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Entradas
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Saídas
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
