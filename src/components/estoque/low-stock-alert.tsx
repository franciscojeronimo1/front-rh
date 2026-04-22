"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LowStockResponse } from "@/lib/api"

export type LowStockAlertProps = {
  data: LowStockResponse
  previewLimit?: number
}

export function LowStockAlert({ data, previewLimit = 5 }: LowStockAlertProps) {
  if (!data.products.length) return null

  return (
    <Card className="rounded-2xl border-red-200 bg-white shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Produtos com estoque baixo
        </CardTitle>
        <CardDescription>{data.products.length} produto(s) abaixo do estoque mínimo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.products.slice(0, previewLimit).map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-xl bg-red-500/5 p-3">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.currentStock} {product.unit} / Mínimo: {product.minStock} {product.unit}
                </p>
              </div>
              <span className="font-bold text-red-600">-{product.deficit}</span>
            </div>
          ))}
          {data.products.length > previewLimit && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              +{data.products.length - previewLimit} produto(s) com estoque baixo
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
