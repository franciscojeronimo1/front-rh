import { format, parse } from "date-fns"
import type { DailyUsageExit, DailyUsageResponse, WeeklyUsageResponse } from "@/lib/api"

export function formatDateBrFromIso(isoDate: string): string {
  return format(parse(isoDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")
}

export function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function formatBrlOptional(value: string | null | undefined): string {
  if (value == null || value === "") return "-"
  const n = parseFloat(value)
  if (Number.isNaN(n)) return "-"
  return formatBrl(n)
}

function sumExitPrices(exits: DailyUsageExit[] | undefined): number {
  if (!exits?.length) return 0
  return exits.reduce((s, e) => s + (e.totalPrice ? parseFloat(e.totalPrice) : 0), 0)
}

export function summarizeDailyUsage(daily: DailyUsageResponse): {
  totalExits: number
  totalQuantity: number
  totalValue: number
  productCount: number
} {
  const products = daily.products ?? []
  const totalQuantity = products.reduce((sum, p) => sum + p.totalQuantity, 0)
  const totalValue = products.reduce((sum, p) => sum + sumExitPrices(p.exits), 0)
  return {
    totalExits: daily.totalExits ?? 0,
    totalQuantity,
    totalValue,
    productCount: products.length,
  }
}

export function summarizeWeeklyUsage(weekly: WeeklyUsageResponse): {
  totalExits: number
  totalQuantity: number
  totalValue: number
  productCount: number
} {
  const products = weekly.products ?? []
  const totalQuantity = products.reduce((sum, p) => sum + p.totalQuantity, 0)
  const totalValue = products.reduce((sum, p) => sum + sumExitPrices(p.exits), 0)
  const totalExits =
    weekly.totalExits ?? products.reduce((sum, p) => sum + (p.exits?.length ?? 0), 0)
  return {
    totalExits,
    totalQuantity,
    totalValue,
    productCount: products.length,
  }
}

export type UsageExitRow = {
  key: string
  productName: string
  quantity: number
  unit: string
  unitPrice: string | null | undefined
  totalPrice: string | null | undefined
  clientName: string | null | undefined
  projectName: string | null | undefined
  serviceType: string | null | undefined
  notes: string | null | undefined
}

export function buildUsageExitRows(
  products: Array<{
    product: { name: string; unit: string }
    exits: DailyUsageExit[] | undefined
  }>
): UsageExitRow[] {
  return products.flatMap((productItem) =>
    (productItem.exits ?? []).map((exit) => ({
      key: exit.id,
      productName: productItem.product.name,
      quantity: exit.quantity,
      unit: productItem.product.unit,
      unitPrice: exit.unitPrice,
      totalPrice: exit.totalPrice,
      clientName: exit.clientName,
      projectName: exit.projectName,
      serviceType: exit.serviceType,
      notes: exit.notes,
    }))
  )
}
