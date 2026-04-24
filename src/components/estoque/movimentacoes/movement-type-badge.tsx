"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import type { StockMovement } from "@/lib/api"

export function MovementTypeBadge({ movement }: { movement: StockMovement }) {
  if (movement.type === "entry") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <ArrowDown className="h-3 w-3" />
        Entrada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-700">
      <ArrowUp className="h-3 w-3" />
      Saída
    </span>
  )
}
