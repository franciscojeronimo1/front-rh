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
  Loader2,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Search,
  History,
  Pencil,
} from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  getStockMovements,
  type StockMovementsResponse,
  type StockMovement,
} from "@/lib/api"
import { ProductCombobox } from "@/components/product-combobox"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MovimentacoesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [data, setData] = useState<StockMovementsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pageInputValue, setPageInputValue] = useState("1")

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [productId, setProductId] = useState("")
  const [supplier, setSupplier] = useState("")
  const [client, setClient] = useState("")
  const [type, setType] = useState<"entry" | "exit" | "all">("all")

  const LIMIT_OPTIONS = [10, 20, 30, 50] as const

  const loadMovements = async (overrides?: {
    page?: number
    dateFrom?: string
    dateTo?: string
    productId?: string
    supplier?: string
    client?: string
    type?: "entry" | "exit" | "all"
  }) => {
    const effectivePage = overrides?.page ?? page
    const effDateFrom = overrides?.dateFrom ?? dateFrom
    const effDateTo = overrides?.dateTo ?? dateTo
    const effProductId = overrides?.productId ?? productId
    const effSupplier = overrides?.supplier ?? supplier
    const effClient = overrides?.client ?? client
    const effType = overrides?.type ?? type
    try {
      setIsLoading(true)
      setError("")
      const response = await getStockMovements({
        dateFrom: effDateFrom || undefined,
        dateTo: effDateTo || undefined,
        productId: effProductId || undefined,
        supplier: effSupplier.trim() || undefined,
        client: effClient.trim() || undefined,
        type: effType === "all" ? undefined : effType,
        page: effectivePage,
        limit,
      })
      setData(response)
      if (overrides?.page !== undefined) {
        setPage(effectivePage)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar movimentações")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [page, limit,])

  useEffect(() => {
    setPageInputValue(page.toString())
  }, [page])

  const handleFilter = () => {
    setPage(1)
    setPageInputValue("1")
    loadMovements({ page: 1 })
  }

  const handleClearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setProductId("")
    setSupplier("")
    setClient("")
    setType("all")
    setPage(1)
    setPageInputValue("1")
    loadMovements({
      page: 1,
      dateFrom: "",
      dateTo: "",
      productId: "",
      supplier: "",
      client: "",
      type: "all",
    })
  }

  const pagination = data?.pagination

  const goToPage = (value: string) => {
    if (!pagination) return
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > pagination.totalPages) {
      setPageInputValue(pagination.page.toString())
      return
    }
    setPage(num)
    setPageInputValue(num.toString())
  }

  const formatType = (movement: StockMovement) => {
    if (movement.type === "entry") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
          <ArrowDown className="h-3 w-3" />
          Entrada
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
        <ArrowUp className="h-3 w-3" />
        Saída
      </span>
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
              onClick={() => router.push("/estoque")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Movimentações</h1>
              <p className="text-muted-foreground">
                Histórico de entradas e saídas do estoque
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre por período, produto, fornecedor ou cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data inicial</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data final</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Produto</label>
                <ProductCombobox
                  value={productId}
                  onChange={setProductId}
                  placeholder="Todos os produtos"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as "entry" | "exit" | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entry">Entrada</SelectItem>
                    <SelectItem value="exit">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fornecedor</label>
                <Input
                  placeholder="Buscar por fornecedor"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cliente</label>
                <Input
                  placeholder="Buscar por cliente"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Filtrar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Movimentações
            </CardTitle>
            <CardDescription>
              {data?.movements.length === 0 ? (
                "Nenhuma movimentação encontrada"
              ) : pagination ? (
                <>
                  Mostrando{" "}
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  de {pagination.total} movimentações
                </>
              ) : (
                "Lista de entradas e saídas"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={8} columns={10} />
            ) : !data?.movements.length ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma movimentação encontrada. Ajuste os filtros ou registre entradas e saídas.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => {
                        setLimit(Number(value))
                        setPage(1)
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead>Fornecedor / Cliente</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.movements.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>{formatType(mov)}</TableCell>
                          <TableCell>
                            {format(new Date(mov.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="block truncate max-w-[180px]" title={`${mov.product.name}${mov.product.code ? ` (${mov.product.code})` : ""}`}>
                              {mov.product.name}
                              {mov.product.code && (
                                <span className="text-muted-foreground ml-1">
                                  ({mov.product.code})
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{mov.quantity}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(mov.unitPrice)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(mov.totalPrice)}
                          </TableCell>
                          <TableCell>{mov.registeredBy.name}</TableCell>
                          <TableCell>
                            <span className="block truncate max-w-[140px]" title={mov.type === "entry" ? (mov.supplierName || "") : (mov.clientName || "")}>
                              {mov.type === "entry"
                                ? mov.supplierName || "-"
                                : mov.clientName || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block truncate max-w-[200px]" title={mov.notes || ""}>
                              {mov.notes || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link
                                href={
                                  mov.type === "entry"
                                    ? `/estoque/entrada/${mov.id}/edit`
                                    : `/estoque/saida/${mov.id}/edit`
                                }
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Página</span>
                      <Input
                        type="number"
                        min={1}
                        max={pagination.totalPages}
                        value={pageInputValue || pagination.page}
                        onChange={(e) => setPageInputValue(e.target.value)}
                        onBlur={() => goToPage(pageInputValue || pagination.page.toString())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            goToPage(pageInputValue || pagination.page.toString())
                        }}
                        className="w-14 h-8 text-center px-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                      />
                      <span>de {pagination.totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={!pagination.hasNext}
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
      </div>
    </div>
  )
}
