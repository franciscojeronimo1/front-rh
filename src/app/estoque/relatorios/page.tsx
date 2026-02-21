"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Loader2, TrendingUp, AlertTriangle, DollarSign, Calendar } from "lucide-react"
import {
  getLowStock,
  getDailyUsage,
  getWeeklyUsage,
  getTotalValue,
  getCurrentStock,
  type LowStockResponse,
  type DailyUsageResponse,
  type WeeklyUsageResponse,
  type TotalValueResponse,
  type CurrentStockResponse,
} from "@/lib/api"
import { format, parse } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RelatoriosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"low" | "daily" | "weekly" | "current" | "value">(
    "low"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")


  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null)

  const [dailyUsage, setDailyUsage] = useState<DailyUsageResponse | null>(null)
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsageResponse | null>(null)
  const [weeklyStartDate, setWeeklyStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), "yyyy-MM-dd")
  )

  const [currentStock, setCurrentStock] = useState<CurrentStockResponse | null>(null)

  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null)

  const loadLowStock = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getLowStock()
      setLowStock(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estoque baixo")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDailyUsage = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getDailyUsage(dailyDate)
      setDailyUsage(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar uso diário")
      setDailyUsage({
        date: dailyDate,
        products: [],
        totalExits: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadWeeklyUsage = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getWeeklyUsage(weeklyStartDate)
      setWeeklyUsage({
        ...response,
        usage: response.usage || [],
        totalItems: response.totalItems || 0,
        totalQuantity: response.totalQuantity || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar uso semanal")
      setWeeklyUsage({
        startDate: weeklyStartDate,
        endDate: weeklyStartDate,
        usage: [],
        totalItems: 0,
        totalQuantity: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentStock = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getCurrentStock()
      setCurrentStock(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estoque atual")
    } finally {
      setIsLoading(false)
    }
  }

  const loadTotalValue = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getTotalValue()
      setTotalValue(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar valor total")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    switch (activeTab) {
      case "low":
        loadLowStock()
        break
      case "daily":
        loadDailyUsage()
        break
      case "weekly":
        loadWeeklyUsage()
        break
      case "current":
        loadCurrentStock()
        break
      case "value":
        loadTotalValue()
        break
    }
  }, [activeTab, dailyDate, weeklyStartDate])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/estoque")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios de Estoque</h1>
            <p className="text-muted-foreground">Visualize análises e relatórios do estoque</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Button
            variant={activeTab === "low" ? "default" : "outline"}
            onClick={() => setActiveTab("low")}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Estoque Baixo
          </Button>
          <Button
            variant={activeTab === "daily" ? "default" : "outline"}
            onClick={() => setActiveTab("daily")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Uso Diário
          </Button>
          <Button
            variant={activeTab === "weekly" ? "default" : "outline"}
            onClick={() => setActiveTab("weekly")}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Uso Semanal
          </Button>
          <Button
            variant={activeTab === "current" ? "default" : "outline"}
            onClick={() => setActiveTab("current")}
            className="flex items-center gap-2"
          >
            Estoque Atual
          </Button>
          <Button
            variant={activeTab === "value" ? "default" : "outline"}
            onClick={() => setActiveTab("value")}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Valor Total
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTab === "low" && lowStock && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Produtos com Estoque Baixo
                  </CardTitle>
                  <CardDescription>
                    {lowStock.products.length} produto(s) abaixo do estoque mínimo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lowStock.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum produto com estoque baixo</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Estoque Atual</TableHead>
                            <TableHead>Estoque Mínimo</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Déficit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStock.products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category || "-"}</TableCell>
                              <TableCell className="text-destructive font-bold">
                                {product.currentStock}
                              </TableCell>
                              <TableCell>{product.minStock}</TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell className="text-destructive font-bold">
                                -{product.deficit}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "daily" && dailyUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Uso Diário
                  </CardTitle>
                  <CardDescription>
                    Uso de produtos no dia{" "}
                    {format(parse(dailyDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="w-full md:w-auto"
                    />
                  </div>
                  {!dailyUsage.products || dailyUsage.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum uso registrado neste dia</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total de Saídas</p>
                          <p className="text-2xl font-bold">{dailyUsage.totalExits || 0}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Quantidade Total</p>
                          <p className="text-2xl font-bold">
                            {dailyUsage.products.reduce((sum, p) => sum + p.totalQuantity, 0)}
                          </p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Unidade</TableHead>
                              <TableHead>Saídas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dailyUsage.products.map((productItem) => (
                              <TableRow key={productItem.product.id}>
                                <TableCell className="font-medium">
                                  {productItem.product.name}
                                </TableCell>
                                <TableCell>{productItem.totalQuantity}</TableCell>
                                <TableCell>{productItem.product.unit}</TableCell>
                                <TableCell>{productItem.exits.length}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "weekly" && weeklyUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Uso Semanal
                  </CardTitle>
                  <CardDescription>
                    De {format(new Date(weeklyUsage.startDate), "dd/MM/yyyy")} até{" "}
                    {format(new Date(weeklyUsage.endDate), "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      type="date"
                      value={weeklyStartDate}
                      onChange={(e) => setWeeklyStartDate(e.target.value)}
                      className="w-full md:w-auto"
                    />
                  </div>
                  {!weeklyUsage.usage || weeklyUsage.usage.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum uso registrado nesta semana</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total de Itens</p>
                          <p className="text-2xl font-bold">{weeklyUsage.totalItems || 0}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Quantidade Total</p>
                          <p className="text-2xl font-bold">{weeklyUsage.totalQuantity || 0}</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Unidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {weeklyUsage.usage.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "current" && currentStock && (
              <Card>
                <CardHeader>
                  <CardTitle>Estoque Atual</CardTitle>
                  <CardDescription>
                    Lista completa de produtos e seus estoques atuais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentStock.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead>Mínimo</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Custo Médio</TableHead>
                            <TableHead>Valor Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentStock.products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category || "-"}</TableCell>
                              <TableCell
                                className={
                                  product.currentStock < product.minStock
                                    ? "text-destructive font-bold"
                                    : ""
                                }
                              >
                                {product.currentStock}
                              </TableCell>
                              <TableCell>{product.minStock}</TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>
                                {product.averageCost
                                  ? new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(parseFloat(product.averageCost))
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {product.totalValue
                                  ? new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(parseFloat(product.totalValue))
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "value" && totalValue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valor Total do Estoque
                  </CardTitle>
                  <CardDescription>Valorização total do estoque atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-primary/10 p-6 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
                      <p className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(parseFloat(totalValue.totalValue))}
                      </p>
                    </div>
                    <div className="bg-muted p-6 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Total de Produtos</p>
                      <p className="text-3xl font-bold">{totalValue.totalProducts}</p>
                    </div>
                    <div className="bg-muted p-6 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Produtos com Valor
                      </p>
                      <p className="text-3xl font-bold">{totalValue.productsWithStock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

