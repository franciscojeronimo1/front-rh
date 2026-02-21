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
} from "lucide-react"
import {
  getProducts,
  getCategories,
  deleteProduct,
  type Product,
  type PaginationInfo,
} from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

const LIMIT_OPTIONS = [10, 20, 30] as const

export default function ProdutosPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(10)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageInputValue, setPageInputValue] = useState("")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

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
  }, [categoryFilter, activeFilter, page, limit])

  useEffect(() => {
    if (!isLoading && products.length === 0 && pagination && pagination.page > 1) {
      setPage(1)
    }
  }, [isLoading, products.length, pagination])

  useEffect(() => {
    if (pagination) {
      setPageInputValue(pagination.page.toString())
    }
  }, [pagination?.page])

  const handleLimitChange = (value: string) => {
    setLimit(Number(value))
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }

  const handleActiveChange = (value: string) => {
    setActiveFilter(value)
    setPage(1)
  }

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

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      await deleteProduct(productToDelete.id)
      setSuccess("Produto deletado com sucesso!")
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "true" && product.active) ||
      (activeFilter === "false" && !product.active)
    return matchesSearch && matchesActive
  })

  const isLowStock = (product: Product) => product.currentStock < product.minStock

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
              <h1 className="text-3xl font-bold text-foreground mb-2">Produtos</h1>
              <p className="text-muted-foreground">Gerencie seus produtos e estoque</p>
            </div>
          </div>
          <Button onClick={() => router.push("/estoque/produtos/novo")}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
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
            <CardDescription>Filtre produtos por categoria e status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.code || "-"}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                isLowStock(product)
                                  ? "text-destructive font-bold"
                                  : "text-foreground"
                              }
                            >
                              {product.currentStock}
                            </span>
                            {isLowStock(product) && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.minStock}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>
                          {product.costPrice
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(parseFloat(product.costPrice))
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/estoque/produtos/${product.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setProductToDelete(product)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
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
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar o produto {productToDelete?.name}? Esta ação
                marcará o produto como inativo.
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
                    Deletando...
                  </>
                ) : (
                  "Deletar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

