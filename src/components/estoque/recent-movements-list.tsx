"use client"

import Link from "next/link"
import { parseISO, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { estoqueDashboardLayout } from "@/lib/estoque/dashboard-tokens"
import { shortPersonName } from "@/lib/estoque/dashboard-utils"
import type { StockMovement } from "@/lib/api"

export type RecentMovementsListProps = {
  movements: StockMovement[]
  viewAllHref?: string
}

export function RecentMovementsList({
  movements,
  viewAllHref = "/estoque/movimentacoes",
}: RecentMovementsListProps) {
  return (
    <Card className={`${estoqueDashboardLayout.card} lg:col-span-2`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Movimentações recentes</CardTitle>
        <CardDescription>Últimas atividades registradas</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[320px] space-y-2 overflow-y-auto pr-1 pt-0">
        {movements.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          movements.map((mov) => {
            const isEntry = mov.type === "entry"
            const sign = isEntry ? "+" : "−"
            const qty = Math.abs(mov.quantity)
            const shortName = shortPersonName(mov.registeredBy.name)
            return (
              <div
                key={`${mov.type}-${mov.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isEntry
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-blue-500/15 text-blue-600"
                  }`}
                >
                  {isEntry ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{mov.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {shortName} ·{" "}
                    {formatDistanceToNow(parseISO(mov.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isEntry ? "bg-emerald-500/15 text-emerald-700" : "bg-blue-500/15 text-blue-700"
                  }`}
                >
                  {sign}
                  {qty} UN
                </span>
              </div>
            )
          })
        )}
        <Link
          href={viewAllHref}
          className="mt-2 block text-center text-sm font-medium text-blue-600 hover:underline"
        >
          Ver todas as movimentações
        </Link>
      </CardContent>
    </Card>
  )
}
