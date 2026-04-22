import { format, parseISO, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getStockMovements, type StockMovement } from "@/lib/api"
import type { DayMovementBucket, TrendDelta, WeekChartPoint } from "./dashboard-types"

export function lastNDays(n: number, end: Date = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => subDays(end, n - 1 - i))
}

export type SparklineGeometry = { area: string; line: string }

export function buildSparklineGeometry(
  values: number[],
  width: number,
  height: number
): SparklineGeometry | null {
  if (values.length === 0) return null
  const pad = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0
  const yAt = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)

  const pts = values.map((v, i) => {
    const x = pad + i * step
    const y = yAt(v)
    return { x, y }
  })

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const area = `M ${pad} ${height} L ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} L ${(pad + (values.length - 1) * step).toFixed(1)} ${height} Z`

  return { area, line }
}

export function pctChangeLabel(thisSum: number, prevSum: number): TrendDelta | null {
  if (prevSum === 0 && thisSum === 0) return null
  if (prevSum === 0) return { text: "+100%", positive: true }
  const pct = Math.round(((thisSum - prevSum) / prevSum) * 100)
  if (pct === 0) return { text: "0%", positive: true }
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 }
}

export async function fetchMovementsInRange(
  dateFrom: string,
  dateTo: string,
  maxPages = 25
): Promise<StockMovement[]> {
  const all: StockMovement[] = []
  let page = 1
  const limit = 200
  while (page <= maxPages) {
    const res = await getStockMovements({
      dateFrom,
      dateTo,
      page,
      limit,
    })
    all.push(...res.movements)
    if (!res.pagination.hasNext) break
    page += 1
  }
  return all
}

export function aggregateMovementBuckets(
  movements: StockMovement[],
  days: Date[]
): DayMovementBucket[] {
  const keys = days.map((d) => format(d, "yyyy-MM-dd"))
  const acc: Record<string, DayMovementBucket> = {}
  keys.forEach((k) => {
    acc[k] = { entradas: 0, saidas: 0, entryValue: 0 }
  })
  for (const m of movements) {
    const k = format(parseISO(m.createdAt), "yyyy-MM-dd")
    if (!acc[k]) continue
    if (m.type === "entry") {
      acc[k].entradas += m.quantity
      acc[k].entryValue += m.totalPrice
    } else {
      acc[k].saidas += m.quantity
    }
  }
  return keys.map((k) => acc[k])
}

export function weekChartFromBuckets(days: Date[], buckets: DayMovementBucket[]): WeekChartPoint[] {
  return days.map((d, i) => ({
    label: format(d, "EEE", { locale: ptBR }).replace(".", ""),
    entradas: buckets[i].entradas,
    saidas: buckets[i].saidas,
  }))
}

export function shortPersonName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0]} ${parts[1].charAt(0)}.`
  return parts[0] ?? "—"
}
