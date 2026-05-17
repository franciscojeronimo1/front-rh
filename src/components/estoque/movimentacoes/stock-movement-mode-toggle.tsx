"use client"

import { Layers, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { StockMovementMode } from "@/lib/estoque/batch-movement-utils"

export type StockMovementModeToggleProps = {
  value: StockMovementMode
  onChange: (mode: StockMovementMode) => void
  disabled?: boolean
  variant: "entry" | "exit"
}

export function StockMovementModeToggle({
  value,
  onChange,
  disabled,
  variant,
}: StockMovementModeToggleProps) {
  const activeClass =
    variant === "entry"
      ? "rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
      : "rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700"

  const inactiveClass =
    "rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"

  const tabClass = (mode: StockMovementMode) =>
    value === mode ? activeClass : inactiveClass

  return (
    <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Modo de registro">
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        className={cn(
          "flex h-auto min-h-11 items-center justify-center gap-2 py-2.5",
          tabClass("single")
        )}
        onClick={() => onChange("single")}
      >
        <Package className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Item único</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        className={cn(
          "flex h-auto min-h-11 items-center justify-center gap-2 py-2.5",
          tabClass("batch")
        )}
        onClick={() => onChange("batch")}
      >
        <Layers className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Vários itens</span>
      </Button>
    </div>
  )
}
