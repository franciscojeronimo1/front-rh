"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  PackagePlus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  getProducts,
  getCategories,
  deleteProduct,
  type Product,
  type PaginationInfo,
} from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const LIMIT_OPTIONS = [10, 20, 30] as const
const SEARCH_DEBOUNCE_MS = 400

function buildListQuery(params: {
  page?: number
  limit?: number
  category?: string
  active?: string
  supplier?: string
  q?: string
  lowStock?: boolean
}) {
  const sp = new URLSearchParams()
  if (params.page != null && params.page > 1) sp.set("page", String(params.page))
  if (params.limit != null && params.limit !== 10) sp.set("limit", String(params.limit))
  if (params.category && params.category !== "all") sp.set("category", params.category)
  if (params.active && params.active !== "all") sp.set("active", params.active)
  if (params.supplier?.trim()) sp.set("supplier", params.supplier.trim())
  if (params.q?.trim()) sp.set("q", params.q.trim())
  if (params.lowStock) sp.set("lowStock", "true")
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

type StockRowTone = "zero" | "low" | "ok"

function getStockRowTone(product: Product): StockRowTone {
  const stock = product.currentStock ?? 0
  const min = product.minStock ?? 0
  if (stock === 0) return "zero"
  if (min > 0 && stock <= min) return "low"
  return "ok"
}

/** Exibe validade em dd/mm/aaaa sem deslocar fuso (YYYY-MM-DD do backend). */
function formatProductExpiration(iso?: string | null): string {
  if (!iso) return "—"
  const datePart = iso.split("T")[0]
  const [y, m, d] = datePart.split("-").map(Number)
  if (!y || !m || !d) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

function isProductExpirationPast(iso?: string | null): boolean {
  if (!iso) return false
  const datePart = iso.split("T")[0]
  const [y, m, d] = datePart.split("-").map(Number)
  if (!y || !m || !d) return false
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  return end < new Date()
}

const tableCellCompact = "px-2 py-1.5 align-middle"
const tableHeadCompact = "px-2 py-2 h-9 text-xs font-semibold whitespace-nowrap"

export default function ProdutosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "10", 10) || 10)
  const categoryFilter = searchParams.get("category") ?? "all"
  const activeFilter = searchParams.get("active") ?? "all"
  const supplierFilter = searchParams.get("supplier") ?? ""
  const searchFromUrl = searchParams.get("q") ?? ""
  const lowStockFilter = searchParams.get("lowStock") === "true"

  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchFromUrl)
  const [supplierTerm, setSupplierTerm] = useState(supplierFilter)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageInputValue, setPageInputValue] = useState(page.toString())
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const updateListUrl = useCallback(
    (updates: {
      page?: number
      limit?: number
      category?: string
      active?: string
      supplier?: string
      q?: string
      lowStock?: boolean
    }) => {
      const next = buildListQuery({
        page: updates.page ?? page,
        limit: updates.limit ?? limit,
        category: updates.category ?? categoryFilter,
        active: updates.active ?? activeFilter,
        supplier: updates.supplier !== undefined ? updates.supplier : supplierFilter,
        q: updates.q !== undefined ? updates.q : searchFromUrl,
        lowStock: updates.lowStock !== undefined ? updates.lowStock : lowStockFilter,
      })
      router.replace(pathname + next, { scroll: false })
    },
    [pathname, router, page, limit, categoryFilter, activeFilter, supplierFilter, searchFromUrl, lowStockFilter]
  )

  useEffect(() => {
    setSearchTerm((prev) => (prev !== searchFromUrl ? searchFromUrl : prev))
  }, [searchFromUrl])

  useEffect(() => {
    setSupplierTerm((prev) => (prev !== supplierFilter ? supplierFilter : prev))
  }, [supplierFilter])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories()
        setCategories(response.categories)
      } catch {
        // Silencioso - filtro de categoria continua funcionando com lista vazia
      }
    }
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError("")
      // Backend: includeInactive=true retorna ativos+inativos. Omitido retorna apenas ativos.
      const includeInactive = activeFilter !== "true"
      const response = await getProducts({
        category: categoryFilter === "all" ? undefined : categoryFilter,
        includeInactive,
        lowStock: lowStockFilter ? true : undefined,
        search: searchFromUrl.trim() || undefined,
        supplier: supplierFilter.trim() || undefined,
        page,
        limit,
      })
      setProducts(response.products)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [categoryFilter, activeFilter, supplierFilter, searchFromUrl, lowStockFilter, page, limit])

  useEffect(() => {
    if (!isLoading && products.length === 0 && pagination && pagination.page > 1) {
      updateListUrl({ page: 1 })
    }
  }, [isLoading, products.length, pagination, updateListUrl])


  useEffect(() => {
    setPageInputValue(page.toString())
  }, [page])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== searchFromUrl) {
        setPageInputValue("1")
        updateListUrl({ q: searchTerm, page: 1 })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchTerm, searchFromUrl, updateListUrl])

  useEffect(() => {
    const t = setTimeout(() => {
      if (supplierTerm !== supplierFilter) {
        setPageInputValue("1")
        updateListUrl({ supplier: supplierTerm, page: 1 })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [supplierTerm, supplierFilter, updateListUrl])

  const handleLimitChange = (value: string) => {
    const n = Number(value)
    setPageInputValue("1")
    updateListUrl({ limit: n, page: 1 })
  }

  const handleCategoryChange = (value: string) => {
    setPageInputValue("1")
    updateListUrl({ category: value, page: 1 })
  }

  const handleActiveChange = (value: string) => {
    setPageInputValue("1")
    updateListUrl({ active: value, page: 1 })
  }

  const goToPage = (value: string) => {
    if (!pagination) return
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > pagination.totalPages) {
      setPageInputValue(pagination.page.toString())
      return
    }
    updateListUrl({ page: num })
    setPageInputValue(num.toString())
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      const res = await deleteProduct(productToDelete.id)
      setSuccess(res.message || "Produto excluído com sucesso")
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      loadProducts()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar produto")
    } finally {
      setIsDeleting(false)
    }
  }

  // Busca é feita no backend (search). Filtro de status ativo/inativo ainda é local.
  const filteredProducts = products.filter((product) => {
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "true" && product.active) ||
      (activeFilter === "false" && !product.active)
    return matchesActive
  })

  const isLowStock = (product: Product) =>
    (product.currentStock ?? 0) <= (product.minStock ?? 0)

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/estoque")}
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 truncate">Produtos</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus produtos e estoque</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/estoque/produtos/importar")}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => router.push("/estoque/produtos/novo")}>
              <PackagePlus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-success bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre produtos por busca, fornecedor, categoria, status e estoque baixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por fornecedor..."
                  value={supplierTerm}
                  onChange={(e) => setSupplierTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={handleActiveChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt.toString()}>
                      {opt} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Checkbox
                id="filter-low-stock"
                checked={lowStockFilter}
                onCheckedChange={(checked) => {
                  setPageInputValue("1")
                  updateListUrl({ lowStock: !!checked, page: 1 })
                }}
              >
                <span className="text-sm font-medium leading-none">Estoque baixo</span>
              </Checkbox>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Produtos
              {pagination ? (
                <> ({pagination.total} {pagination.total === 1 ? "produto" : "produtos"})</>
              ) : (
                ` (${filteredProducts.length})`
              )}
            </CardTitle>
            <CardDescription>
              {filteredProducts.length === 0
                ? "Nenhum produto encontrado"
                : pagination
                  ? `Mostrando ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total}`
                  : `${filteredProducts.length} produto(s) na página`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={8} columns={12} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <PackagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
                <Button
                  onClick={() => router.push("/estoque/produtos/novo")}
                  className="mt-4"
                >
                  Criar Primeiro Produto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border shadow-sm -mx-1 px-1 sm:mx-0 sm:px-0">
                <Table className="min-w-[980px] w-full text-xs sm:text-[13px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className={cn(tableHeadCompact, "min-w-[140px] max-w-[220px]")}>Nome</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[72px]")}>Código</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[96px] max-w-[130px]")}>Categoria</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[76px]")}>Validade</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[88px] max-w-[120px]")}>Fornecedor</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[64px] text-right")}>Est.</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[48px] text-right")}>Mín.</TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[44px] text-center hidden lg:table-cell")}>
                        Un.
                      </TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[84px] text-right whitespace-nowrap")}>
                        P. custo
                      </TableHead>
                      <TableHead
                        className={cn(
                          tableHeadCompact,
                          "min-w-[84px] text-right whitespace-nowrap hidden xl:table-cell"
                        )}
                      >
                        P. médio
                      </TableHead>
                      <TableHead className={cn(tableHeadCompact, "min-w-[68px]")}>Status</TableHead>
                      <TableHead className={cn(tableHeadCompact, "w-10 min-w-10 text-right")} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const rowTone = getStockRowTone(product)
                      const expired = isProductExpirationPast(product.expirationDate)
                      const returnUrl =
                        pathname +
                        buildListQuery({
                          page,
                          limit,
                          category: categoryFilter,
                          active: activeFilter,
                          supplier: supplierTerm.trim() || undefined,
                          q: searchTerm.trim() || undefined,
                          lowStock: lowStockFilter,
                        })
                      return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          "group",
                          rowTone === "zero" &&
                            "bg-rose-50/75 dark:bg-rose-950/25 hover:bg-rose-100/65 dark:hover:bg-rose-950/40 text-foreground/90",
                          rowTone === "low" &&
                            "bg-orange-50/80 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-950/35",
                          rowTone === "ok" && "bg-background"
                        )}
                      >
                        <TableCell className={cn(tableCellCompact, "font-medium min-w-[140px] max-w-[220px]")}>
                          <span className="line-clamp-2" title={product.name}>{product.name}</span>
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "whitespace-nowrap tabular-nums")}>
                          {product.code || "—"}
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "max-w-[130px]")}>
                          <span className="truncate block" title={product.category || undefined}>
                            {product.category || "—"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            tableCellCompact,
                            "whitespace-nowrap tabular-nums",
                            expired && product.expirationDate && "text-destructive font-medium"
                          )}
                          title={product.expirationDate || undefined}
                        >
                          {formatProductExpiration(product.expirationDate)}
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "max-w-[120px]")} title={product.supplierName || undefined}>
                          <span className="truncate block">{product.supplierName || "—"}</span>
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "text-right")}>
                          <div className="flex items-center justify-end gap-1">
                            <span
                              className={cn(
                                "tabular-nums",
                                rowTone === "zero" && "text-destructive font-bold",
                                rowTone === "low" &&
                                  "text-orange-700 dark:text-orange-400 font-semibold",
                                rowTone === "ok" && "text-foreground"
                              )}
                            >
                              {product.currentStock}
                            </span>
                            {isLowStock(product) && (
                              <AlertTriangle
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  rowTone === "zero" && "text-destructive",
                                  rowTone === "low" && "text-orange-600 dark:text-orange-400"
                                )}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "text-right tabular-nums")}>{product.minStock}</TableCell>
                        <TableCell className={cn(tableCellCompact, "text-center hidden lg:table-cell tabular-nums")}>
                          {product.unit}
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "text-right whitespace-nowrap tabular-nums")}>
                          {product.costPrice
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                maximumFractionDigits: 2,
                              }).format(parseFloat(product.costPrice))
                            : "—"}
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "text-right whitespace-nowrap tabular-nums hidden xl:table-cell")}>
                          {product.averageCost
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                maximumFractionDigits: 2,
                              }).format(parseFloat(product.averageCost))
                            : "—"}
                        </TableCell>
                        <TableCell className={tableCellCompact}>
                          <span
                            className={cn(
                              "inline-flex px-1.5 py-0.5 rounded-full text-[0.65rem] sm:text-xs font-medium",
                              product.active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {product.active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className={cn(tableCellCompact, "text-right w-10")}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Ações: ${product.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/estoque/produtos/${product.id}?from=${encodeURIComponent(returnUrl)}`
                                  )
                                }
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setProductToDelete(product)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
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
                      if (e.key === "Enter") goToPage(pageInputValue || pagination.page.toString())
                    }}
                    className="w-14 h-8 text-center px-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                  />
                  <span>de {pagination.totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateListUrl({ page: Math.max(1, page - 1) })}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateListUrl({ page: Math.min(pagination.totalPages, page + 1) })}
                    disabled={!pagination.hasNext}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exclusão definitiva</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    O produto <span className="font-medium text-foreground">{productToDelete?.name}</span> será{" "}
                    <strong className="text-foreground">removido permanentemente</strong> do sistema.
                  </p>
                  <p>
                    Todas as <strong className="text-foreground">entradas e saídas de estoque</strong> associadas a
                    este produto também serão apagadas. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setProductToDelete(null)
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir definitivamente"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

