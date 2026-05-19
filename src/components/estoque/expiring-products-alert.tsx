"use client"

import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ExpiringStockResponse } from "@/lib/api"
import {
  formatExpirationSituationFromIso,
  formatProductExpirationBr,
  getExpirationCalendarMetrics,
} from "@/lib/product-expiration"

export type ExpiringProductsAlertProps = {
  data: ExpiringStockResponse
  totalCount?: number
  windowDays?: number
  previewLimit?: number
}

export function ExpiringProductsAlert({
  data,
  totalCount,
  windowDays = 30,
  previewLimit = 5,
}: ExpiringProductsAlertProps) {
  if (!data.products.length) return null

  const total = totalCount ?? data.pagination?.total ?? data.products.length
  const shown = Math.min(previewLimit, data.products.length)
  const remaining = Math.max(0, total - shown)

  return (
    <Card className="rounded-2xl border-amber-200 bg-white shadow-md">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <CalendarClock className="h-5 w-5" />
            Validade próxima ou vencida
          </CardTitle>
          <CardDescription>
            {total} produto(s) com validade nos próximos {windowDays} dias (inclui vencidos)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/estoque/relatorios?tab=expiring">Ver relatório</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.products.slice(0, previewLimit).map((product) => {
            const metrics = getExpirationCalendarMetrics(product.expirationDate)
            const isExpired = metrics?.isExpired ?? product.isExpired
            return (
              <div
                key={product.id}
                className={`flex items-center justify-between rounded-xl p-3 ${
                  isExpired ? "bg-red-500/5" : "bg-amber-500/5"
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Validade: {formatProductExpirationBr(product.expirationDate)} ·{" "}
                    {product.currentStock} {product.unit} em estoque
                  </p>
                </div>
                <span
                  className={`shrink-0 text-right text-sm font-semibold ${
                    isExpired ? "text-red-600" : "text-amber-700"
                  }`}
                >
                  {formatExpirationSituationFromIso(product.expirationDate)}
                </span>
              </div>
            )
          })}
          {remaining > 0 && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              +{remaining} produto(s) — abra o relatório de validade
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
