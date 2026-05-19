"use client"

import { useCallback, useState } from "react"
import { format } from "date-fns"
import {
  getTotalValue,
  getLowStock,
  getExpiringStock,
  getCurrentStock,
  getStockMovements,
  type TotalValueResponse,
  type LowStockResponse,
  type ExpiringStockResponse,
  type StockMovement,
} from "@/lib/api"

const EXPIRING_ALERT_DAYS = 30
import {
  aggregateMovementBuckets,
  fetchMovementsInRange,
  lastNDays,
  pctChangeLabel,
  weekChartFromBuckets,
} from "@/lib/estoque/dashboard-utils"
import type { TrendDelta, WeekChartPoint } from "@/lib/estoque/dashboard-types"

/** Soma quantidades de saída em um conjunto de buckets (um por dia). */
function sumSaidas(buckets: { saidas: number }[]): number {
  return buckets.reduce((s, b) => s + b.saidas, 0)
}

export function useEstoqueDashboard() {
  const [bootstrapping, setBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null)
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [expiringStock, setExpiringStock] = useState<ExpiringStockResponse | null>(null)
  const [currentStockCount, setCurrentStockCount] = useState(0)
  const [dailyUsageTotal, setDailyUsageTotal] = useState(0)
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [weekChart, setWeekChart] = useState<WeekChartPoint[]>([])
  const [sparkValor, setSparkValor] = useState<number[]>([])
  const [sparkProdutos, setSparkProdutos] = useState<number[]>([])
  const [sparkBaixo, setSparkBaixo] = useState<number[]>([])
  const [sparkUso, setSparkUso] = useState<number[]>([])
  const [trendValor, setTrendValor] = useState<TrendDelta | null>(null)
  const [trendProdutos, setTrendProdutos] = useState<TrendDelta | null>(null)
  const [trendBaixo, setTrendBaixo] = useState<TrendDelta | null>(null)
  const [trendUso, setTrendUso] = useState<TrendDelta | null>(null)

  const loadData = useCallback(async (silent?: boolean) => {
    try {
      if (silent) setIsRefreshing(true)

      const dayList7 = lastNDays(7)
      const dayList14 = lastNDays(14)
      const from14 = format(dayList14[0], "yyyy-MM-dd")
      const to = format(new Date(), "yyyy-MM-dd")

      const [totalValueData, lowStockData, expiringData, currentStockData, recentRes, movements14] =
        await Promise.all([
          getTotalValue(),
          getLowStock(),
          getExpiringStock({ days: EXPIRING_ALERT_DAYS, limit: 5 }),
          getCurrentStock(),
          getStockMovements({ page: 1, limit: 12 }),
          fetchMovementsInRange(from14, to),
        ])

      setTotalValue(totalValueData)
      setLowStock(lowStockData)
      setLowStockCount(lowStockData.pagination?.total ?? lowStockData.products.length)
      setExpiringStock(expiringData)
      setCurrentStockCount(currentStockData.pagination?.total ?? currentStockData.products.length)
      setRecentMovements(recentRes.movements)

      const b7 = aggregateMovementBuckets(movements14, dayList7)
      const b14first = aggregateMovementBuckets(movements14, dayList14.slice(0, 7))

      const usoPorDia = b7.map((b) => b.saidas)
      setSparkUso(usoPorDia)
      setDailyUsageTotal(b7[b7.length - 1]?.saidas ?? 0)
      setTrendUso(pctChangeLabel(sumSaidas(b7), sumSaidas(b14first)))

      setWeekChart(weekChartFromBuckets(dayList7, b7))
      setSparkValor(b7.map((b) => b.entryValue))
      setSparkProdutos(b7.map((b) => b.entradas))
      setSparkBaixo(b7.map((b) => b.saidas))

      const sumEntryValue = (arr: typeof b7) => arr.reduce((s, b) => s + b.entryValue, 0)
      setTrendValor(pctChangeLabel(sumEntryValue(b7), sumEntryValue(b14first)))

      const entradasSum = (arr: typeof b7) => arr.reduce((s, b) => s + b.entradas, 0)
      setTrendProdutos(pctChangeLabel(entradasSum(b7), entradasSum(b14first)))

      // Mesma base que "Uso hoje" (% de volume de saídas); evita repetir no card de estoque baixo.
      setTrendBaixo(null)
    } catch (error) {
      console.error("Erro ao carregar dados do estoque:", error)
      setDailyUsageTotal(0)
    } finally {
      if (!silent) setBootstrapping(false)
      setIsRefreshing(false)
    }
  }, [])

  return {
    bootstrapping,
    isRefreshing,
    totalValue,
    lowStock,
    lowStockCount,
    expiringStock,
    expiringWindowDays: EXPIRING_ALERT_DAYS,
    currentStockCount,
    dailyUsageTotal,
    recentMovements,
    weekChart,
    sparkValor,
    sparkProdutos,
    sparkBaixo,
    sparkUso,
    trendValor,
    trendProdutos,
    trendBaixo,
    trendUso,
    loadData,
  }
}
