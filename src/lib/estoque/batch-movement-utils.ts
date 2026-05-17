import type { Product } from "@/lib/api"

export const BATCH_MOVEMENT_MAX_ITEMS = 100
export const BATCH_MOVEMENT_MIN_ITEMS = 1

export type StockMovementMode = "single" | "batch"

export type BatchLineItem = {
  id: string
  productId: string
  product: Product | null
  quantity: string
  unitPrice: string
}

export function createBatchLineItem(): BatchLineItem {
  return {
    id: crypto.randomUUID(),
    productId: "",
    product: null,
    quantity: "",
    unitPrice: "",
  }
}

export function parsePositiveNumber(value: string): number | null {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) return null
  return num
}

export function getLineTotal(quantity: string, unitPrice: string): number {
  const qty = parsePositiveNumber(quantity)
  const price = parsePositiveNumber(unitPrice)
  if (qty == null || price == null) return 0
  return qty * price
}

export function getBatchGrandTotal(items: BatchLineItem[]): number {
  return items.reduce((sum, item) => sum + getLineTotal(item.quantity, item.unitPrice), 0)
}

export function resolveDefaultEntryUnitPrice(product: Product): string {
  const avgCost = product.averageCost ? parseFloat(product.averageCost) : NaN
  const cost = product.costPrice ? parseFloat(product.costPrice) : NaN
  const price = !isNaN(avgCost) && avgCost > 0 ? avgCost : !isNaN(cost) && cost > 0 ? cost : 0
  return price > 0 ? price.toFixed(2) : ""
}

export function resolveDefaultExitUnitPrice(product: Product): string {
  if (product.salePrice) {
    const salePriceNum = parseFloat(product.salePrice)
    if (!isNaN(salePriceNum) && salePriceNum > 0) {
      return salePriceNum.toFixed(2)
    }
  }
  return ""
}

type BatchValidationResult =
  | { ok: true }
  | { ok: false; message: string; lineId?: string }

export function validateEntryBatchItems(items: BatchLineItem[]): BatchValidationResult {
  const filled = items.filter((i) => i.productId || i.quantity || i.unitPrice)
  if (filled.length < BATCH_MOVEMENT_MIN_ITEMS) {
    return { ok: false, message: "Adicione pelo menos um item à entrada." }
  }
  if (filled.length > BATCH_MOVEMENT_MAX_ITEMS) {
    return { ok: false, message: `Máximo de ${BATCH_MOVEMENT_MAX_ITEMS} itens por lote.` }
  }

  for (let i = 0; i < filled.length; i++) {
    const item = filled[i]
    const line = i + 1
    if (!item.productId) {
      return { ok: false, message: `Selecione o produto na linha ${line}.`, lineId: item.id }
    }
    if (parsePositiveNumber(item.quantity) == null) {
      return { ok: false, message: `Quantidade inválida na linha ${line}.`, lineId: item.id }
    }
    if (parsePositiveNumber(item.unitPrice) == null) {
      return { ok: false, message: `Preço unitário inválido na linha ${line}.`, lineId: item.id }
    }
  }

  return { ok: true }
}

export function validateExitBatchItems(items: BatchLineItem[]): BatchValidationResult {
  const filled = items.filter((i) => i.productId || i.quantity || i.unitPrice)
  if (filled.length < BATCH_MOVEMENT_MIN_ITEMS) {
    return { ok: false, message: "Adicione pelo menos um item à saída." }
  }
  if (filled.length > BATCH_MOVEMENT_MAX_ITEMS) {
    return { ok: false, message: `Máximo de ${BATCH_MOVEMENT_MAX_ITEMS} itens por lote.` }
  }

  for (let i = 0; i < filled.length; i++) {
    const item = filled[i]
    const line = i + 1
    if (!item.productId) {
      return { ok: false, message: `Selecione o produto na linha ${line}.`, lineId: item.id }
    }
    if (parsePositiveNumber(item.quantity) == null) {
      return { ok: false, message: `Quantidade inválida na linha ${line}.`, lineId: item.id }
    }
    const unitPrice = item.unitPrice.trim()
    if (unitPrice !== "" && parsePositiveNumber(unitPrice) == null) {
      return { ok: false, message: `Preço unitário inválido na linha ${line}.`, lineId: item.id }
    }
  }

  return { ok: true }
}

export function aggregateQuantitiesByProduct(
  items: BatchLineItem[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    if (!item.productId) continue
    const qty = parsePositiveNumber(item.quantity)
    if (qty == null) continue
    map.set(item.productId, (map.get(item.productId) ?? 0) + qty)
  }
  return map
}

export function validateExitBatchStock(
  items: BatchLineItem[],
  productsById: Map<string, Product>
): BatchValidationResult {
  const aggregated = aggregateQuantitiesByProduct(items)

  for (const [productId, totalQty] of aggregated) {
    const product = productsById.get(productId)
    if (!product) continue
    const stock = product.currentStock ?? 0
    if (totalQty > stock) {
      const unit = (product.unit ?? "").trim()
      const suffix = unit ? ` ${unit}` : ""
      return {
        ok: false,
        message: `Estoque insuficiente para "${product.name}": disponível ${stock}${suffix}, solicitado ${totalQty}.`,
      }
    }
  }

  return { ok: true }
}

export function getFilledBatchItems(items: BatchLineItem[]): BatchLineItem[] {
  return items.filter((i) => i.productId)
}
