"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react"
import {
  getTotalValue,
  getLowStock,
  getCurrentStock,
  getDailyUsage,
  type TotalValueResponse,
  type LowStockResponse,
} from "@/lib/api"
import { format } from "date-fns"

export default function EstoquePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null)
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null)
  const [currentStockCount, setCurrentStockCount] = useState(0)
  const [dailyUsageTotal, setDailyUsageTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const today = format(new Date(), "yyyy-MM-dd")
      const [totalValueData, lowStockData, currentStockData, dailyUsageData] = await Promise.all([
        getTotalValue(),
        getLowStock(),
        getCurrentStock(),
        getDailyUsage(today),
      ])

      setTotalValue(totalValueData)
      setLowStock(lowStockData)
      setCurrentStockCount(currentStockData.pagination?.total ?? currentStockData.products.length)

      // Calcular total de itens usados hoje somando totalQuantity de cada produto
      const totalItems = dailyUsageData?.products?.reduce((sum, product) => sum + product.totalQuantity, 0) || 0
      setDailyUsageTotal(totalItems)
    } catch (error) {
      console.error("Erro ao carregar dados do estoque:", error)
      setDailyUsageTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    const handleFocus = () => {
      loadData()
    }
    
    window.addEventListener("focus", handleFocus)
    
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Controle de Estoque</h1>
              <p className="text-muted-foreground">Gerencie produtos, entradas e saídas</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalValue
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(totalValue.totalValue))
                  : "R$ 0,00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalValue?.productsWithStock || 0} produtos com valor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Produtos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {lowStock?.products.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Produtos abaixo do mínimo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyUsageTotal}</div>
              <p className="text-xs text-muted-foreground mt-1">Itens utilizados hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/estoque/produtos">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Produtos
                </CardTitle>
                <CardDescription>Listar e gerenciar produtos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/estoque/entrada">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-success" />
                  Registrar Entrada
                </CardTitle>
                <CardDescription>Registrar compra/recebimento</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Registrar
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/estoque/saida">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-destructive" />
                  Registrar Saída
                </CardTitle>
                <CardDescription>Registrar uso/consumo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Registrar
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/estoque/relatorios">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Relatórios
                </CardTitle>
                <CardDescription>Visualizar relatórios e análises</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alerta de Estoque Baixo */}
        {lowStock && lowStock.products.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Produtos com Estoque Baixo
              </CardTitle>
              <CardDescription>
                {lowStock.products.length} produto(s) abaixo do estoque mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 bg-destructive/10 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.currentStock} {product.unit} / Mínimo: {product.minStock}{" "}
                        {product.unit}
                      </p>
                    </div>
                    <span className="text-destructive font-bold">-{product.deficit}</span>
                  </div>
                ))}
                {lowStock.products.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{lowStock.products.length - 5} produto(s) com estoque baixo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

