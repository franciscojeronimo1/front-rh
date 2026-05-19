"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { AlertTriangle, Calendar, CalendarClock, DollarSign, TrendingUp } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  EstoqueRelatoriosHeader,
  EstoqueRelatoriosTabBar,
  ReportStatTiles,
  UsageExitsTable,
  type RelatorioTab,
} from "@/components/estoque/relatorios"
import { TablePaginationFooter } from "@/components/estoque/shared"
import {
  getLowStock,
  getExpiringStock,
  getDailyUsage,
  getWeeklyUsage,
  getTotalValue,
  getCurrentStock,
  type LowStockResponse,
  type ExpiringStockResponse,
  type DailyUsageResponse,
  type WeeklyUsageResponse,
  type TotalValueResponse,
  type CurrentStockResponse,
} from "@/lib/api"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExportButtons } from "@/components/export-buttons"
import {
  buildLowStockRows,
  buildExpiringStockRows,
  buildDailyUsageRows,
  buildWeeklyUsageRows,
  buildCurrentStockRows,
  buildTotalValueRows,
} from "@/lib/export-utils"
import {
  formatExpirationSituationFromIso,
  formatProductExpirationBr,
  getExpirationCalendarMetrics,
} from "@/lib/product-expiration"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"
import {
  buildUsageExitRows,
  formatBrl,
  formatDateBrFromIso,
  summarizeDailyUsage,
  summarizeWeeklyUsage,
} from "@/lib/estoque/relatorios-utils"

const LIMIT_OPTIONS = [10, 20, 30] as const
const EXPIRING_DAYS_OPTIONS = [7, 15, 30] as const

const VALID_TABS: RelatorioTab[] = ["low", "expiring", "daily", "weekly", "current", "value"]

function DailyUsageReportBody({ data }: { data: DailyUsageResponse }) {
  const s = summarizeDailyUsage(data)
  return (
    <>
      <ReportStatTiles
        items={[
          { label: "Total de saídas", value: s.totalExits },
          { label: "Quantidade total", value: s.totalQuantity },
          { label: "Valor total", value: formatBrl(s.totalValue) },
          { label: "Produtos", value: s.productCount },
        ]}
      />
      <UsageExitsTable rows={buildUsageExitRows(data.products)} />
    </>
  )
}

function WeeklyUsageReportBody({ data }: { data: WeeklyUsageResponse }) {
  const s = summarizeWeeklyUsage(data)
  return (
    <>
      <ReportStatTiles
        items={[
          { label: "Total de saídas", value: s.totalExits },
          { label: "Quantidade total", value: s.totalQuantity },
          { label: "Valor total", value: formatBrl(s.totalValue) },
          { label: "Produtos", value: s.productCount },
        ]}
      />
      <UsageExitsTable rows={buildUsageExitRows(data.products)} />
    </>
  )
}

function RelatoriosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<RelatorioTab>("low")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null)
  const [lowStockPage, setLowStockPage] = useState(1)
  const [lowStockLimit, setLowStockLimit] = useState(20)
  const [lowStockPageInputValue, setLowStockPageInputValue] = useState("1")

  const [expiringStock, setExpiringStock] = useState<ExpiringStockResponse | null>(null)
  const [expiringPage, setExpiringPage] = useState(1)
  const [expiringLimit, setExpiringLimit] = useState(20)
  const [expiringPageInputValue, setExpiringPageInputValue] = useState("1")
  const [expiringDays, setExpiringDays] = useState<(typeof EXPIRING_DAYS_OPTIONS)[number]>(30)
  const [expiringIncludeExpired, setExpiringIncludeExpired] = useState(true)
  const [expiringOnlyWithStock, setExpiringOnlyWithStock] = useState(false)

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

  const loadExpiringStock = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getExpiringStock({
        days: expiringDays,
        includeExpired: expiringIncludeExpired,
        onlyWithStock: expiringOnlyWithStock,
        page: expiringPage,
        limit: expiringLimit,
      })
      setExpiringStock(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar validade dos produtos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && VALID_TABS.includes(tabParam as RelatorioTab)) {
      queueMicrotask(() => setActiveTab(tabParam as RelatorioTab))
    }
  }, [searchParams])

  const lowStockPagination = lowStock?.pagination
  const expiringPagination = expiringStock?.pagination

  useEffect(() => {
    queueMicrotask(() => {
      if (lowStockPagination) {
        setLowStockPageInputValue(lowStockPagination.page.toString())
      }
    })
  }, [lowStockPagination?.page]) // eslint-disable-line react-hooks/exhaustive-deps -- só sincroniza quando a página muda

  useEffect(() => {
    queueMicrotask(() => {
      if (expiringPagination) {
        setExpiringPageInputValue(expiringPagination.page.toString())
      }
    })
  }, [expiringPagination?.page]) // eslint-disable-line react-hooks/exhaustive-deps

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
    queueMicrotask(() => {
      if (currentStockPagination) {
        setCurrentStockPageInputValue(currentStockPagination.page.toString())
      }
    })
  }, [currentStockPagination?.page]) // eslint-disable-line react-hooks/exhaustive-deps -- só sincroniza quando a página muda

  useEffect(() => {
    queueMicrotask(() => {
      if (
        activeTab === "current" &&
        !isLoading &&
        currentStock?.products.length === 0 &&
        currentStockPagination &&
        currentStockPagination.page > 1
      ) {
        setCurrentStockPage(1)
      }
    })
  }, [activeTab, isLoading, currentStock?.products.length, currentStockPagination])

  useEffect(() => {
    queueMicrotask(() => {
      if (
        activeTab === "low" &&
        !isLoading &&
        lowStock?.products.length === 0 &&
        lowStockPagination &&
        lowStockPagination.page > 1
      ) {
        setLowStockPage(1)
      }
    })
  }, [activeTab, isLoading, lowStock?.products.length, lowStockPagination])

  useEffect(() => {
    queueMicrotask(() => {
      if (
        activeTab === "expiring" &&
        !isLoading &&
        expiringStock?.products.length === 0 &&
        expiringPagination &&
        expiringPagination.page > 1
      ) {
        setExpiringPage(1)
      }
    })
  }, [activeTab, isLoading, expiringStock?.products.length, expiringPagination])

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

  // Carregadores leem estado atual via closure; incluir load* nas deps causaria re-execução em loop.
  /* eslint-disable react-hooks/exhaustive-deps -- deps intencionais: aba e parâmetros de listagem */
  useEffect(() => {
    queueMicrotask(() => {
      switch (activeTab) {
        case "low":
          void loadLowStock()
          break
        case "expiring":
          void loadExpiringStock()
          break
        case "daily":
          void loadDailyUsage()
          break
        case "weekly":
          void loadWeeklyUsage()
          break
        case "current":
          void loadCurrentStock()
          break
        case "value":
          void loadTotalValue()
          break
      }
    })
  }, [
    activeTab,
    dailyDate,
    weeklyStartDate,
    currentStockPage,
    currentStockLimit,
    lowStockPage,
    lowStockLimit,
    expiringPage,
    expiringLimit,
    expiringDays,
    expiringIncludeExpired,
    expiringOnlyWithStock,
  ])
  /* eslint-enable react-hooks/exhaustive-deps */

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

  const goToExpiringPage = (value: string) => {
    if (!expiringPagination) return
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > expiringPagination.totalPages) {
      setExpiringPageInputValue(expiringPagination.page.toString())
      return
    }
    setExpiringPage(num)
    setExpiringPageInputValue(num.toString())
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
    <div className={estoqueRelatoriosLayout.page}>
      <div className={estoqueRelatoriosLayout.container}>
        <EstoqueRelatoriosHeader onBack={() => router.push("/estoque")} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <EstoqueRelatoriosTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {isLoading ? (
          <Card className={estoqueRelatoriosLayout.card}>
            <CardContent className="pt-6">
              <TableSkeleton rows={8} columns={6} />
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTab === "low" && lowStock && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Produtos com estoque baixo
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
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhum produto com estoque baixo
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
                              <TableHead>Estoque atual</TableHead>
                              <TableHead>Estoque mínimo</TableHead>
                              <TableHead>Unidade</TableHead>
                              <TableHead>Déficit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lowStock.products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category || "-"}</TableCell>
                                <TableCell className="font-bold text-destructive">
                                  {product.currentStock}
                                </TableCell>
                                <TableCell>{product.minStock}</TableCell>
                                <TableCell>{product.unit}</TableCell>
                                <TableCell className="font-bold text-destructive">
                                  -{(product.deficit ?? product.minStock - product.currentStock)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {lowStockPagination && (
                        <TablePaginationFooter
                          pagination={lowStockPagination}
                          pageInputValue={lowStockPageInputValue}
                          onPageInputChange={setLowStockPageInputValue}
                          onCommitPage={goToLowStockPage}
                          onPrev={() => setLowStockPage((p) => Math.max(1, p - 1))}
                          onNext={() =>
                            setLowStockPage((p) =>
                              Math.min(lowStockPagination.totalPages, p + 1)
                            )
                          }
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "expiring" && expiringStock && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <CalendarClock className="h-5 w-5 text-amber-600" />
                      Validade dos produtos
                    </CardTitle>
                    <CardDescription>
                      {expiringStock.products.length === 0 ? (
                        `Nenhum produto com validade nos próximos ${expiringDays} dias`
                      ) : expiringPagination ? (
                        <>
                          Mostrando{" "}
                          {(expiringPagination.page - 1) * expiringPagination.limit + 1}-
                          {Math.min(
                            expiringPagination.page * expiringPagination.limit,
                            expiringPagination.total
                          )}{" "}
                          de {expiringPagination.total} produto(s)
                          {expiringIncludeExpired ? " (inclui vencidos)" : " (somente a vencer)"}
                        </>
                      ) : (
                        `${expiringStock.products.length} produto(s) na janela de ${expiringDays} dias`
                      )}
                    </CardDescription>
                  </div>
                  <ExportButtons
                    rows={buildExpiringStockRows(expiringStock)}
                    filename={`validade-produtos-${expiringDays}d`}
                    sheetName="Validade"
                  />
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-sm text-muted-foreground">Janela:</span>
                      <Select
                        value={expiringDays.toString()}
                        onValueChange={(value) => {
                          setExpiringDays(Number(value) as (typeof EXPIRING_DAYS_OPTIONS)[number])
                          setExpiringPage(1)
                        }}
                      >
                        <SelectTrigger className="h-9 w-[7.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRING_DAYS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt.toString()}>
                              {opt} dias
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="expiring-include-expired"
                        checked={expiringIncludeExpired}
                        onCheckedChange={(checked) => {
                          setExpiringIncludeExpired(checked === true)
                          setExpiringPage(1)
                        }}
                      />
                      <Label
                        htmlFor="expiring-include-expired"
                        className="cursor-pointer text-sm font-normal leading-none"
                      >
                        Incluir vencidos
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="expiring-only-stock"
                        checked={expiringOnlyWithStock}
                        onCheckedChange={(checked) => {
                          setExpiringOnlyWithStock(checked === true)
                          setExpiringPage(1)
                        }}
                      />
                      <Label
                        htmlFor="expiring-only-stock"
                        className="cursor-pointer text-sm font-normal leading-none"
                      >
                        Somente com estoque
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <span className="shrink-0 text-sm text-muted-foreground">Itens por página:</span>
                      <Select
                        value={expiringLimit.toString()}
                        onValueChange={(value) => {
                          setExpiringLimit(Number(value))
                          setExpiringPage(1)
                        }}
                      >
                        <SelectTrigger className="h-9 w-20">
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
                  {expiringStock.products.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhum produto nesta janela de validade
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Validade</TableHead>
                              <TableHead>Situação</TableHead>
                              <TableHead>Estoque</TableHead>
                              <TableHead>Unidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expiringStock.products.map((product) => {
                              const metrics = getExpirationCalendarMetrics(product.expirationDate)
                              const isExpired = metrics?.isExpired ?? product.isExpired
                              return (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category || "-"}</TableCell>
                                <TableCell
                                  className={
                                    isExpired ? "font-medium text-destructive" : undefined
                                  }
                                >
                                  {formatProductExpirationBr(product.expirationDate)}
                                </TableCell>
                                <TableCell
                                  className={
                                    isExpired
                                      ? "font-medium text-destructive"
                                      : "font-medium text-amber-700"
                                  }
                                >
                                  {formatExpirationSituationFromIso(product.expirationDate)}
                                </TableCell>
                                <TableCell>{product.currentStock}</TableCell>
                                <TableCell>{product.unit}</TableCell>
                              </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {expiringPagination && (
                        <TablePaginationFooter
                          pagination={expiringPagination}
                          pageInputValue={expiringPageInputValue}
                          onPageInputChange={setExpiringPageInputValue}
                          onCommitPage={goToExpiringPage}
                          onPrev={() => setExpiringPage((p) => Math.max(1, p - 1))}
                          onNext={() =>
                            setExpiringPage((p) =>
                              Math.min(expiringPagination.totalPages, p + 1)
                            )
                          }
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "daily" && dailyUsage && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Uso diário
                    </CardTitle>
                    <CardDescription>
                      Uso de produtos no dia {formatDateBrFromIso(dailyDate)}
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
                      className="w-full rounded-xl border-slate-200 md:w-auto"
                    />
                  </div>
                  {!dailyUsage.products || dailyUsage.products.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhum uso registrado neste dia
                    </div>
                  ) : (
                    <DailyUsageReportBody data={dailyUsage} />
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "weekly" && weeklyUsage && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Uso semanal
                    </CardTitle>
                    <CardDescription>
                      De {formatDateBrFromIso(weeklyUsage.startDate)} até{" "}
                      {formatDateBrFromIso(weeklyUsage.endDate)}
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
                      className="w-full rounded-xl border-slate-200 md:w-auto"
                    />
                  </div>
                  {!weeklyUsage.products || weeklyUsage.products.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhum uso registrado nesta semana
                    </div>
                  ) : (
                    <WeeklyUsageReportBody data={weeklyUsage} />
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "current" && currentStock && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-900">Estoque atual</CardTitle>
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
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhum produto cadastrado
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
                              <TableHead>Custo médio</TableHead>
                              <TableHead>Valor total</TableHead>
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
                                      ? "font-bold text-destructive"
                                      : ""
                                  }
                                >
                                  {product.currentStock}
                                </TableCell>
                                <TableCell>{product.minStock}</TableCell>
                                <TableCell>{product.unit}</TableCell>
                                <TableCell>
                                  {product.averageCost
                                    ? formatBrl(parseFloat(String(product.averageCost)))
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {product.totalValue != null
                                    ? formatBrl(
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
                      {currentStockPagination && (
                        <TablePaginationFooter
                          pagination={currentStockPagination}
                          pageInputValue={currentStockPageInputValue}
                          onPageInputChange={setCurrentStockPageInputValue}
                          onCommitPage={goToCurrentStockPage}
                          onPrev={() => setCurrentStockPage((p) => Math.max(1, p - 1))}
                          onNext={() =>
                            setCurrentStockPage((p) =>
                              Math.min(currentStockPagination.totalPages, p + 1)
                            )
                          }
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "value" && totalValue && (
              <Card className={estoqueRelatoriosLayout.card}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      Valor total do estoque
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className={estoqueRelatoriosLayout.statBlockPrimary}>
                      <p className="mb-2 text-sm text-muted-foreground">Valor total</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatBrl(parseFloat(totalValue.totalValue))}
                      </p>
                    </div>
                    <div className={estoqueRelatoriosLayout.statBlock}>
                      <p className="mb-2 text-sm text-muted-foreground">Total de produtos</p>
                      <p className="text-3xl font-bold text-slate-900">{totalValue.totalProducts}</p>
                    </div>
                    <div className={estoqueRelatoriosLayout.statBlock}>
                      <p className="mb-2 text-sm text-muted-foreground">Produtos com valor</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {totalValue.productsWithStock}
                      </p>
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

export default function RelatoriosPage() {
  return (
    <Suspense
      fallback={
        <div className={estoqueRelatoriosLayout.page}>
          <div className={estoqueRelatoriosLayout.container}>
            <Card className={estoqueRelatoriosLayout.card}>
              <CardContent className="pt-6">
                <TableSkeleton rows={8} columns={6} />
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <RelatoriosContent />
    </Suspense>
  )
}
