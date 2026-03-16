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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
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
import { ExportButtons } from "@/components/export-buttons"
import {
  buildLowStockRows,
  buildDailyUsageRows,
  buildWeeklyUsageRows,
  buildCurrentStockRows,
  buildTotalValueRows,
} from "@/lib/export-utils"

export default function RelatoriosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"low" | "daily" | "weekly" | "current" | "value">(
    "low"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")


  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null)
  const [lowStockPage, setLowStockPage] = useState(1)
  const [lowStockLimit, setLowStockLimit] = useState(20)
  const [lowStockPageInputValue, setLowStockPageInputValue] = useState("1")

  const [dailyUsage, setDailyUsage] = useState<DailyUsageResponse | null>(null)
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsageResponse | null>(null)
  const [weeklyStartDate, setWeeklyStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), "yyyy-MM-dd")
  )

  const [currentStock, setCurrentStock] = useState<CurrentStockResponse | null>(null)
  const [currentStockPage, setCurrentStockPage] = useState(1)
  const [currentStockLimit, setCurrentStockLimit] = useState(20)
  const [currentStockPageInputValue, setCurrentStockPageInputValue] = useState("1")

  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null)

  const LIMIT_OPTIONS = [10, 20, 30] as const

  const loadLowStock = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getLowStock({
        page: lowStockPage,
        limit: lowStockLimit,
      })
      setLowStock(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estoque baixo")
    } finally {
      setIsLoading(false)
    }
  }

  const lowStockPagination = lowStock?.pagination

  useEffect(() => {
    if (lowStockPagination) {
      setLowStockPageInputValue(lowStockPagination.page.toString())
    }
  }, [lowStockPagination?.page])

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
      setWeeklyUsage(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar uso semanal")
      setWeeklyUsage({
        startDate: weeklyStartDate,
        endDate: weeklyStartDate,
        products: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentStock = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getCurrentStock({
        page: currentStockPage,
        limit: currentStockLimit,
      })
      setCurrentStock(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estoque atual")
    } finally {
      setIsLoading(false)
    }
  }

  const currentStockPagination = currentStock?.pagination

  useEffect(() => {
    if (currentStockPagination) {
      setCurrentStockPageInputValue(currentStockPagination.page.toString())
    }
  }, [currentStockPagination?.page])

  useEffect(() => {
    if (
      activeTab === "current" &&
      !isLoading &&
      currentStock?.products.length === 0 &&
      currentStockPagination &&
      currentStockPagination.page > 1
    ) {
      setCurrentStockPage(1)
    }
  }, [activeTab, isLoading, currentStock?.products.length, currentStockPagination])

  useEffect(() => {
    if (
      activeTab === "low" &&
      !isLoading &&
      lowStock?.products.length === 0 &&
      lowStockPagination &&
      lowStockPagination.page > 1
    ) {
      setLowStockPage(1)
    }
  }, [activeTab, isLoading, lowStock?.products.length, lowStockPagination])

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
  }, [activeTab, dailyDate, weeklyStartDate, currentStockPage, currentStockLimit, lowStockPage, lowStockLimit])

  const goToLowStockPage = (value: string) => {
    if (!lowStockPagination) return
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > lowStockPagination.totalPages) {
      setLowStockPageInputValue(lowStockPagination.page.toString())
      return
    }
    setLowStockPage(num)
    setLowStockPageInputValue(num.toString())
  }

  const goToCurrentStockPage = (value: string) => {
    if (!currentStockPagination) return
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > currentStockPagination.totalPages) {
      setCurrentStockPageInputValue(currentStockPagination.page.toString())
      return
    }
    setCurrentStockPage(num)
    setCurrentStockPageInputValue(num.toString())
  }

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
            <CardContent className="pt-6">
              <TableSkeleton rows={8} columns={6} />
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTab === "low" && lowStock && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Produtos com Estoque Baixo
                    </CardTitle>
                    <CardDescription>
                      {lowStock.products.length === 0 ? (
                        "Nenhum produto com estoque baixo"
                      ) : lowStock.pagination ? (
                        <>
                          Mostrando{" "}
                          {(lowStock.pagination.page - 1) * lowStock.pagination.limit + 1}-
                          {Math.min(
                            lowStock.pagination.page * lowStock.pagination.limit,
                            lowStock.pagination.total
                          )}{" "}
                          de {lowStock.pagination.total} produto(s) abaixo do mínimo
                        </>
                      ) : (
                        `${lowStock.products.length} produto(s) abaixo do estoque mínimo`
                      )}
                    </CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildLowStockRows(lowStock)}
                    filename="estoque-baixo"
                    sheetName="Estoque Baixo"
                  />
                </CardHeader>
                <CardContent>
                  {lowStock.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum produto com estoque baixo</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Itens por página:</span>
                          <Select
                            value={lowStockLimit.toString()}
                            onValueChange={(value) => {
                              setLowStockLimit(Number(value))
                              setLowStockPage(1)
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LIMIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt.toString()}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
                                  -{(product.deficit ?? product.minStock - product.currentStock)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {lowStockPagination && lowStockPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Página</span>
                            <Input
                              type="number"
                              min={1}
                              max={lowStockPagination.totalPages}
                              value={
                                lowStockPageInputValue || lowStockPagination.page
                              }
                              onChange={(e) =>
                                setLowStockPageInputValue(e.target.value)
                              }
                              onBlur={() =>
                                goToLowStockPage(
                                  lowStockPageInputValue ||
                                    lowStockPagination.page.toString()
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  goToLowStockPage(
                                    lowStockPageInputValue ||
                                      lowStockPagination.page.toString()
                                  )
                              }}
                              className="w-14 h-8 text-center px-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                            />
                            <span>de {lowStockPagination.totalPages}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLowStockPage((p) => Math.max(1, p - 1))
                              }
                              disabled={!lowStockPagination.hasPrev}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLowStockPage((p) =>
                                  Math.min(
                                    lowStockPagination.totalPages,
                                    p + 1
                                  )
                                )
                              }
                              disabled={!lowStockPagination.hasNext}
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "daily" && dailyUsage && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Uso Diário
                    </CardTitle>
                    <CardDescription>
                      Uso de produtos no dia{" "}
                      {format(parse(dailyDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                    </CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildDailyUsageRows(dailyUsage)}
                    filename={`uso-diario-${dailyDate}`}
                    sheetName="Uso Diário"
                  />
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
                      {(() => {
                        const totalValue = dailyUsage.products.reduce((sum, p) => {
                          return (
                            sum +
                            p.exits.reduce(
                              (s, e) => s + (e.totalPrice ? parseFloat(e.totalPrice) : 0),
                              0
                            )
                          )
                        }, 0)
                        const totalQuantity = dailyUsage.products.reduce(
                          (sum, p) => sum + p.totalQuantity,
                          0
                        )
                        return (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total de Saídas</p>
                                <p className="text-2xl font-bold">
                                  {dailyUsage.totalExits || 0}
                                </p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                                <p className="text-2xl font-bold">{totalQuantity}</p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Valor Total</p>
                                <p className="text-2xl font-bold">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(totalValue)}
                                </p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Produtos</p>
                                <p className="text-2xl font-bold">
                                  {dailyUsage.products.length}
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
                                    <TableHead>Preço Unit.</TableHead>
                                    <TableHead>Valor Total</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Projeto</TableHead>
                                    <TableHead>Tipo Serviço</TableHead>
                                    <TableHead>Observações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dailyUsage.products.flatMap((productItem) =>
                                    productItem.exits.map((exit) => (
                                      <TableRow key={exit.id}>
                                        <TableCell className="font-medium">
                                          {productItem.product.name}
                                        </TableCell>
                                        <TableCell>{exit.quantity}</TableCell>
                                        <TableCell>{productItem.product.unit}</TableCell>
                                        <TableCell>
                                          {exit.unitPrice
                                            ? new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                              }).format(parseFloat(exit.unitPrice))
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          {exit.totalPrice
                                            ? new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                              }).format(parseFloat(exit.totalPrice))
                                            : "-"}
                                        </TableCell>
                                        <TableCell>{exit.clientName || "-"}</TableCell>
                                        <TableCell>{exit.projectName || "-"}</TableCell>
                                        <TableCell>{exit.serviceType || "-"}</TableCell>
                                        <TableCell>
                                          {exit.notes || "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "weekly" && weeklyUsage && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Uso Semanal
                    </CardTitle>
                    <CardDescription>
                      De {format(parse(weeklyUsage.startDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}{" "}
                      até {format(parse(weeklyUsage.endDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                    </CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildWeeklyUsageRows(weeklyUsage)}
                    filename={`uso-semanal-${weeklyUsage.startDate}`}
                    sheetName="Uso Semanal"
                  />
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
                  {!weeklyUsage.products || weeklyUsage.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum uso registrado nesta semana</p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const totalValue = weeklyUsage.products.reduce((sum, p) => {
                          return (
                            sum +
                            (p.exits || []).reduce(
                              (s, e) => s + (e.totalPrice ? parseFloat(e.totalPrice) : 0),
                              0
                            )
                          )
                        }, 0)
                        const totalQuantity = weeklyUsage.products.reduce(
                          (sum, p) => sum + p.totalQuantity,
                          0
                        )
                        const totalExits =
                          weeklyUsage.totalExits ??
                          weeklyUsage.products.reduce(
                            (sum, p) => sum + (p.exits?.length || 0),
                            0
                          )
                        return (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total de Saídas</p>
                                <p className="text-2xl font-bold">{totalExits}</p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                                <p className="text-2xl font-bold">{totalQuantity}</p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Valor Total</p>
                                <p className="text-2xl font-bold">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(totalValue)}
                                </p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Produtos</p>
                                <p className="text-2xl font-bold">{weeklyUsage.products.length}</p>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Quantidade</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Preço Unit.</TableHead>
                                    <TableHead>Valor Total</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Projeto</TableHead>
                                    <TableHead>Tipo Serviço</TableHead>
                                    <TableHead>Observações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {weeklyUsage.products.flatMap((productItem) =>
                                    (productItem.exits || []).map((exit) => (
                                      <TableRow key={exit.id}>
                                        <TableCell className="font-medium">
                                          {productItem.product.name}
                                        </TableCell>
                                        <TableCell>{exit.quantity}</TableCell>
                                        <TableCell>{productItem.product.unit}</TableCell>
                                        <TableCell>
                                          {exit.unitPrice
                                            ? new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                              }).format(parseFloat(exit.unitPrice))
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          {exit.totalPrice
                                            ? new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                              }).format(parseFloat(exit.totalPrice))
                                            : "-"}
                                        </TableCell>
                                        <TableCell>{exit.clientName || "-"}</TableCell>
                                        <TableCell>{exit.projectName || "-"}</TableCell>
                                        <TableCell>{exit.serviceType || "-"}</TableCell>
                                        <TableCell>{exit.notes || "-"}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "current" && currentStock && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>Estoque Atual</CardTitle>
                    <CardDescription>
                      {currentStock.products.length === 0 ? (
                        "Nenhum produto cadastrado"
                      ) : currentStock.pagination ? (
                        <>
                          Mostrando{" "}
                          {(currentStock.pagination.page - 1) * currentStock.pagination.limit + 1}-
                          {Math.min(
                            currentStock.pagination.page * currentStock.pagination.limit,
                            currentStock.pagination.total
                          )}{" "}
                          de {currentStock.pagination.total} produto(s)
                        </>
                      ) : (
                        "Lista completa de produtos e seus estoques atuais"
                      )}
                    </CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildCurrentStockRows(currentStock)}
                    filename="estoque-atual"
                    sheetName="Estoque Atual"
                  />
                </CardHeader>
                <CardContent>
                  {currentStock.products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Itens por página:</span>
                          <Select
                            value={currentStockLimit.toString()}
                            onValueChange={(value) => {
                              setCurrentStockLimit(Number(value))
                              setCurrentStockPage(1)
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LIMIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt.toString()}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
                                      }).format(parseFloat(String(product.averageCost)))
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {product.totalValue != null
                                    ? new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(
                                        typeof product.totalValue === "number"
                                          ? product.totalValue
                                          : parseFloat(String(product.totalValue))
                                      )
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {currentStockPagination && currentStockPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Página</span>
                            <Input
                              type="number"
                              min={1}
                              max={currentStockPagination.totalPages}
                              value={
                                currentStockPageInputValue ||
                                currentStockPagination.page
                              }
                              onChange={(e) =>
                                setCurrentStockPageInputValue(e.target.value)
                              }
                              onBlur={() =>
                                goToCurrentStockPage(
                                  currentStockPageInputValue ||
                                    currentStockPagination.page.toString()
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  goToCurrentStockPage(
                                    currentStockPageInputValue ||
                                      currentStockPagination.page.toString()
                                  )
                              }}
                              className="w-14 h-8 text-center px-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                            />
                            <span>de {currentStockPagination.totalPages}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentStockPage((p) => Math.max(1, p - 1))
                              }
                              disabled={!currentStockPagination.hasPrev}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentStockPage((p) =>
                                  Math.min(
                                    currentStockPagination.totalPages,
                                    p + 1
                                  )
                                )
                              }
                              disabled={!currentStockPagination.hasNext}
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "value" && totalValue && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Valor Total do Estoque
                    </CardTitle>
                    <CardDescription>Valorização total do estoque atual</CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildTotalValueRows(totalValue)}
                    filename="valor-total-estoque"
                    sheetName="Valor Total"
                    hideWhenEmpty={false}
                  />
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

