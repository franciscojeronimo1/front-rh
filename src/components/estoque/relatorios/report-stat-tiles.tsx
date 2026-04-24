"use client"

import type { ReactNode } from "react"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"

export type ReportStatItem = {
  label: string
  value: ReactNode
}

export type ReportStatTilesProps = {
  items: ReportStatItem[]
}

export function ReportStatTiles({ items }: ReportStatTilesProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={estoqueRelatoriosLayout.statTile}>
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
