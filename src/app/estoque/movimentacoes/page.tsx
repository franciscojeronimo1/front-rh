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
import { Loader2, Search, History, Pencil, Trash2 } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  deleteStockEntry,
  deleteStockExit,
  getStockMovements,
  type StockMovementsResponse,
} from "@/lib/api"
import { ProductCombobox } from "@/components/product-combobox"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"
import { formatBrl } from "@/lib/estoque/relatorios-utils"
import { EstoqueSubpageHeader, MovementTypeBadge, TablePaginationFooter } from "@/components/estoque"

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

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    type: "entry" | "exit"
    productName: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  /* eslint-disable react-hooks/exhaustive-deps -- loadMovements lê estado via closure */
  useEffect(() => {
    queueMicrotask(() => {
      void loadMovements()
    })
  }, [page, limit])
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    queueMicrotask(() => {
      setPageInputValue(page.toString())
    })
  }, [page])

  const handleFilter = () => {
    setPage(1)
    setPageInputValue("1")
    void loadMovements({ page: 1 })
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
    void loadMovements({
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

  const confirmDeleteMovement = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      setError("")
      if (deleteTarget.type === "entry") {
        await deleteStockEntry(deleteTarget.id)
      } else {
        await deleteStockExit(deleteTarget.id)
      }
      setDeleteTarget(null)
      await loadMovements()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir movimentação")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={estoqueRelatoriosLayout.page}>
      <div className={estoqueRelatoriosLayout.container}>
        <EstoqueSubpageHeader
          title="Movimentações"
          subtitle="Histórico de entradas e saídas do estoque"
          onBack={() => router.push("/estoque")}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className={estoqueRelatoriosLayout.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Search className="h-5 w-5 text-blue-600" />
              Filtros
            </CardTitle>
            <CardDescription>Filtre por período, produto, fornecedor ou cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Data inicial</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Data final</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Produto</label>
                <ProductCombobox
                  value={productId}
                  onChange={setProductId}
                  placeholder="Todos os produtos"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as "entry" | "exit" | "all")}>
                  <SelectTrigger className="rounded-xl border-slate-200">
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
                <label className="mb-1 block text-sm font-medium">Fornecedor</label>
                <Input
                  placeholder="Buscar por fornecedor"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cliente</label>
                <Input
                  placeholder="Buscar por cliente"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleFilter}
                disabled={isLoading}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Filtrar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="rounded-xl border-slate-200">
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={estoqueRelatoriosLayout.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <History className="h-5 w-5 text-slate-600" />
              Histórico de movimentações
            </CardTitle>
            <CardDescription>
              {data?.movements.length === 0 ? (
                "Nenhuma movimentação encontrada"
              ) : pagination ? (
                <>
                  Mostrando {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}{" "}
                  movimentações
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
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma movimentação encontrada. Ajuste os filtros ou registre entradas e saídas.
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
                      <SelectTrigger className="w-20 rounded-xl border-slate-200">
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
                        <TableHead>Preço unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead>Fornecedor / cliente</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.movements.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            <MovementTypeBadge movement={mov} />
                          </TableCell>
                          <TableCell>
                            {format(new Date(mov.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span
                              className="block max-w-[180px] truncate"
                              title={`${mov.product.name}${mov.product.code ? ` (${mov.product.code})` : ""}`}
                            >
                              {mov.product.name}
                              {mov.product.code && (
                                <span className="ml-1 text-muted-foreground">({mov.product.code})</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{mov.quantity}</TableCell>
                          <TableCell>{formatBrl(mov.unitPrice)}</TableCell>
                          <TableCell>{formatBrl(mov.totalPrice)}</TableCell>
                          <TableCell>{mov.registeredBy.name}</TableCell>
                          <TableCell>
                            <span
                              className="block max-w-[140px] truncate"
                              title={mov.type === "entry" ? mov.supplierName || "" : mov.clientName || ""}
                            >
                              {mov.type === "entry" ? mov.supplierName || "-" : mov.clientName || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block max-w-[200px] truncate" title={mov.notes || ""}>
                              {mov.notes || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Excluir"
                                onClick={() =>
                                  setDeleteTarget({
                                    id: mov.id,
                                    type: mov.type,
                                    productName: mov.product.name,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {pagination && (
                  <TablePaginationFooter
                    pagination={pagination}
                    pageInputValue={pageInputValue}
                    onPageInputChange={setPageInputValue}
                    onCommitPage={goToPage}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setDeleteTarget(null)
          }}
        >
          <DialogContent showCloseButton={!isDeleting}>
            <DialogHeader>
              <DialogTitle>Excluir movimentação?</DialogTitle>
              <DialogDescription>
                {deleteTarget?.type === "entry" ? "Esta entrada" : "Esta saída"} será removida e o estoque do
                produto será ajustado.{" "}
                {deleteTarget && (
                  <span className="font-medium text-foreground">{deleteTarget.productName}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmDeleteMovement()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
