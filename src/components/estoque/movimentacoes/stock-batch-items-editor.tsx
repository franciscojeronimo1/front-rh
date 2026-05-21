"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCombobox } from "@/components/product-combobox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Product } from "@/lib/api"
import {
  BATCH_MOVEMENT_MAX_ITEMS,
  createBatchLineItem,
  getLineTotal,
  type BatchLineItem,
} from "@/lib/estoque/batch-movement-utils"
import { formatBrl } from "@/lib/estoque/relatorios-utils"
import { cn } from "@/lib/utils"

export type StockBatchItemsEditorProps = {
  items: BatchLineItem[]
  onChange: (items: BatchLineItem[]) => void
  variant: "entry" | "exit"
  disabled?: boolean
  /** Destaca linha com erro de validação */
  errorLineId?: string | null
  onProductSelect: (lineId: string, product: Product | null) => void
}

export function StockBatchItemsEditor({
  items,
  onChange,
  variant,
  disabled,
  errorLineId,
  onProductSelect,
}: StockBatchItemsEditorProps) {
  const isExit = variant === "exit"
  const canAdd = items.length < BATCH_MOVEMENT_MAX_ITEMS

  const updateItem = (id: string, patch: Partial<BatchLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addLine = () => {
    if (!canAdd) return
    onChange([...items, createBatchLineItem()])
  }

  const removeLine = (id: string) => {
    if (items.length <= 1) return
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">Itens do lote</p>
        
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200"
          onClick={addLine}
          disabled={disabled || !canAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar linha
        </Button>
      </div>

      <div className="rounded-xl border border-slate-100 overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="min-w-[200px]">Produto</TableHead>
              <TableHead className="w-[100px]">Qtd.</TableHead>
              <TableHead className="w-[120px]">
                {isExit ? "Preço venda" : "Preço unit."}
                
              </TableHead>
              <TableHead className="w-[100px] text-right">Subtotal</TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const lineTotal = getLineTotal(item.quantity, item.unitPrice)
              const hasError = errorLineId === item.id
              const maxQty = isExit && item.product ? item.product.currentStock : undefined
              const excludeProductIds = items
                .filter((other) => other.id !== item.id && other.productId)
                .map((other) => other.productId)

              return (
                <TableRow
                  key={item.id}
                  className={cn(hasError && "bg-red-50/60")}
                >
                  <TableCell className="align-top py-3 whitespace-normal min-w-[220px]">
                    <ProductCombobox
                      value={item.productId}
                      onChange={(productId) => updateItem(item.id, { productId })}
                      onProductSelect={(product) => onProductSelect(item.id, product)}
                      placeholder={`Produto ${index + 1}...`}
                      disabled={disabled}
                      showStock={isExit}
                      onlyWithStock={isExit}
                      excludeProductIds={excludeProductIds}
                    />
                    {isExit && item.product && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estoque: {item.product.currentStock} {item.product.unit}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxQty}
                      placeholder="0"
                      value={item.quantity}
                      disabled={disabled}
                      onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                      className={cn(hasError && "border-red-300")}
                    />
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={"0,00"}
                      value={item.unitPrice}
                      disabled={disabled}
                      onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                      className={cn(hasError && "border-red-300")}
                    />
                  </TableCell>
                  <TableCell className="align-top py-3 text-right text-sm font-medium tabular-nums">
                    {lineTotal > 0 ? formatBrl(lineTotal) : "—"}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-600"
                      onClick={() => removeLine(item.id)}
                      disabled={disabled || items.length <= 1}
                      aria-label={`Remover linha ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
