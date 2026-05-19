"use client"

import { AlertTriangle, Calendar, CalendarClock, DollarSign, Package, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"

export type RelatorioTab = "low" | "expiring" | "daily" | "weekly" | "current" | "value"

export type EstoqueRelatoriosTabBarProps = {
  activeTab: RelatorioTab
  onTabChange: (tab: RelatorioTab) => void
}

export function EstoqueRelatoriosTabBar({ activeTab, onTabChange }: EstoqueRelatoriosTabBarProps) {
  const tabClass = (tab: RelatorioTab) =>
    activeTab === tab
      ? "rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700"
      : "rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"

  return (
    <div className={estoqueRelatoriosLayout.tabGrid}>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("low")}`}
        onClick={() => onTabChange("low")}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Estoque baixo</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("expiring")}`}
        onClick={() => onTabChange("expiring")}
      >
        <CalendarClock className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Validade</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("daily")}`}
        onClick={() => onTabChange("daily")}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Uso diário</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("weekly")}`}
        onClick={() => onTabChange("weekly")}
      >
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Uso semanal</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("current")}`}
        onClick={() => onTabChange("current")}
      >
        <Package className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Estoque atual</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex h-auto min-h-11 items-center justify-center gap-2 py-2.5 ${tabClass("value")}`}
        onClick={() => onTabChange("value")}
      >
        <DollarSign className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Valor total</span>
      </Button>
    </div>
  )
}
