"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, AlertTriangle, DollarSign, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useEstoqueDashboard } from "@/hooks/use-estoque-dashboard"
import {
  estoqueDashboardLayout,
  estoqueKpiColors,
  estoqueKpiIconSurface,
} from "@/lib/estoque/dashboard-tokens"
import {
  DashboardKpiCard,
  DashboardQuickActions,
  DashboardWeeklyPanel,
  EstoqueDashboardHeader,
  EstoqueDashboardSkeleton,
  LowStockAlert,
  RecentMovementsList,
} from "@/components/estoque"

export default function EstoquePage() {
  const router = useRouter()
  const {
    bootstrapping,
    isRefreshing,
    totalValue,
    lowStock,
    lowStockCount,
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
  } = useEstoqueDashboard()

  useEffect(() => {
    queueMicrotask(() => {
      void loadData()
    })
  }, [loadData])

  useEffect(() => {
    const handleFocus = () => {
      void loadData(true)
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [loadData])

  const subtitleDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  if (bootstrapping) {
    return <EstoqueDashboardSkeleton />
  }

  return (
    <div className={estoqueDashboardLayout.page}>
      <div className={estoqueDashboardLayout.container}>
        <EstoqueDashboardHeader
          title="Controle de Estoque"
          subtitle={`${subtitleDate} · Visão geral do seu inventário`}
          onBack={() => router.push("/dashboard")}
          onRefresh={() => void loadData(true)}
          isRefreshing={isRefreshing}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard
            label="Valor total"
            icon={<DollarSign className="h-5 w-5" />}
            iconSurfaceClassName={estoqueKpiIconSurface.valor}
            value={
              totalValue
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    parseFloat(totalValue.totalValue)
                  )
                : "R$ 0,00"
            }
            caption={`${totalValue?.productsWithStock ?? 0} produtos com valor`}
            trend={trendValor}
            sparklineValues={sparkValor}
            sparklineStroke={estoqueKpiColors.valor}
          />
          <DashboardKpiCard
            label="Total de produtos"
            icon={<Package className="h-5 w-5" />}
            iconSurfaceClassName={estoqueKpiIconSurface.produtos}
            value={currentStockCount}
            caption="Produtos cadastrados"
            trend={trendProdutos}
            sparklineValues={sparkProdutos}
            sparklineStroke={estoqueKpiColors.produtos}
          />
          <DashboardKpiCard
            label="Estoque baixo"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconSurfaceClassName={estoqueKpiIconSurface.estoqueBaixo}
            value={lowStockCount}
            valueClassName="text-red-600"
            caption="Produtos abaixo do mínimo"
            trend={trendBaixo}
            sparklineValues={sparkBaixo}
            sparklineStroke={estoqueKpiColors.estoqueBaixo}
          />
          <DashboardKpiCard
            label="Uso hoje"
            icon={<Activity className="h-5 w-5" />}
            iconSurfaceClassName={estoqueKpiIconSurface.uso}
            value={dailyUsageTotal}
            caption="Itens utilizados hoje"
            trend={trendUso}
            sparklineValues={sparkUso}
            sparklineStroke={estoqueKpiColors.uso}
            sparklineLineOnly
          />
        </div>

        <DashboardQuickActions />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <DashboardWeeklyPanel data={weekChart} />
          <RecentMovementsList movements={recentMovements} />
        </div>

        {lowStock && lowStock.products.length > 0 && <LowStockAlert data={lowStock} />}
      </div>
    </div>
  )
}
