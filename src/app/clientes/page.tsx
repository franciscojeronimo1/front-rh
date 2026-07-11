"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  deleteClient,
  getClients,
  type Client,
  type PaginationInfo,
} from "@/lib/api"
import { formatCpf, formatPhone, formatZipCode } from "@/lib/schemas/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const LIMIT_OPTIONS = [30, 60, 100] as const
const DEFAULT_LIMIT = 30
const SEARCH_DEBOUNCE_MS = 400

function buildListQuery(params: {
  page?: number
  limit?: number
  active?: string
  q?: string
}) {
  const sp = new URLSearchParams()
  if (params.page != null && params.page > 1) sp.set("page", String(params.page))
  if (params.limit != null && params.limit !== DEFAULT_LIMIT) sp.set("limit", String(params.limit))
  if (params.active && params.active !== "all") sp.set("active", params.active)
  if (params.q?.trim()) sp.set("q", params.q.trim())
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

function formatDisplayDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground wrap-break-word">{value?.trim() ? value : "—"}</p>
    </div>
  )
}

const tableCellCompact = "px-2 py-1.5 align-middle"
const tableHeadCompact = "px-2 py-2 h-9 text-xs font-semibold whitespace-nowrap"

export default function ClientesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limitFromUrl = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  const limit = LIMIT_OPTIONS.includes(limitFromUrl as (typeof LIMIT_OPTIONS)[number])
    ? limitFromUrl
    : DEFAULT_LIMIT
  const activeFilter = searchParams.get("active") ?? "all"
  const searchFromUrl = searchParams.get("q") ?? ""

  const [clients, setClients] = useState<Client[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchFromUrl)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageInputValue, setPageInputValue] = useState(page.toString())
  const [detailClient, setDetailClient] = useState<Client | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const updateListUrl = useCallback(
    (updates: { page?: number; limit?: number; active?: string; q?: string }) => {
      const next = buildListQuery({
        page: updates.page ?? page,
        limit: updates.limit ?? limit,
        active: updates.active ?? activeFilter,
        q: updates.q !== undefined ? updates.q : searchFromUrl,
      })
      router.replace(pathname + next, { scroll: false })
    },
    [pathname, router, page, limit, activeFilter, searchFromUrl]
  )

  useEffect(() => {
    setSearchTerm((prev) => (prev !== searchFromUrl ? searchFromUrl : prev))
  }, [searchFromUrl])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      setError("")
      const includeInactive = activeFilter !== "true"
      const response = await getClients({
        includeInactive,
        search: searchFromUrl.trim() || undefined,
        page,
        limit,
      })
      setClients(response.clients)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar clientes")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [activeFilter, searchFromUrl, page, limit])

  useEffect(() => {
    if (!isLoading && clients.length === 0 && pagination && pagination.page > 1) {
      updateListUrl({ page: 1 })
    }
  }, [isLoading, clients.length, pagination, updateListUrl])

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

  const filteredClients = clients.filter((client) => {
    if (activeFilter === "all") return true
    if (activeFilter === "true") return client.active
    if (activeFilter === "false") return !client.active
    return true
  })

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      setIsDeleting(true)
      const res = await deleteClient(clientToDelete.id)
      setSuccess(res.message || "Cliente excluído com sucesso")
      setDeleteDialogOpen(false)
      setClientToDelete(null)
      loadClients()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir cliente")
    } finally {
      setIsDeleting(false)
    }
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

  const openClientDetail = (client: Client) => {
    setDetailClient(client)
    setDetailOpen(true)
  }

  const addressLine = detailClient
    ? [
        detailClient.street,
        detailClient.neighborhood,
        [detailClient.city, detailClient.state].filter(Boolean).join(" / "),
        detailClient.zipCode ? formatZipCode(detailClient.zipCode) : null,
      ]
        .filter((part) => part && String(part).trim())
        .join(" · ")
    : ""

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Cadastro de clientes
            </p>
          </div>
          <Button onClick={() => router.push("/clientes/novo")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de clientes</CardTitle>
            <CardDescription>Busque por nome, CPF, telefone, e-mail ou cidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={activeFilter}
                onValueChange={(value) => {
                  setPageInputValue("1")
                  updateListUrl({ active: value, page: 1 })
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setPageInputValue("1")
                  updateListUrl({ limit: Number(value), page: 1 })
                }}
              >
                <SelectTrigger className="w-full md:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / pág.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <TableSkeleton rows={8} columns={6} />
            ) : filteredClients.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={tableHeadCompact}>Nome</TableHead>
                      <TableHead className={tableHeadCompact}>CPF</TableHead>
                      <TableHead className={tableHeadCompact}>Telefone</TableHead>
                      <TableHead className={tableHeadCompact}>Cidade</TableHead>
                      <TableHead className={tableHeadCompact}>Status</TableHead>
                      <TableHead className={cn(tableHeadCompact, "w-12")} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() => openClientDetail(client)}
                      >
                        <TableCell className={cn(tableCellCompact, "font-medium")}>
                          {client.name}
                        </TableCell>
                        <TableCell className={tableCellCompact}>
                          {formatCpf(client.cpf)}
                        </TableCell>
                        <TableCell className={tableCellCompact}>
                          {formatPhone(client.phone)}
                        </TableCell>
                        <TableCell className={tableCellCompact}>
                          {client.city || "—"}
                          {client.state ? `/${client.state}` : ""}
                        </TableCell>
                        <TableCell className={tableCellCompact}>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              client.active
                                ? "bg-success/15 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {client.active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={tableCellCompact}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openClientDetail(client)}
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/clientes/${client.id}`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setClientToDelete(client)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {pagination && pagination.total > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  {pagination.total} cliente{pagination.total === 1 ? "" : "s"}
                  {pagination.totalPages > 1 && (
                    <>
                      {" "}
                      · página {pagination.page} de {pagination.totalPages}
                    </>
                  )}
                </p>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!pagination.hasPrev}
                      onClick={() => updateListUrl({ page: page - 1 })}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 text-sm">
                      <Input
                        className="h-8 w-14 text-center"
                        value={pageInputValue}
                        onChange={(e) => setPageInputValue(e.target.value)}
                        onBlur={() => goToPage(pageInputValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") goToPage(pageInputValue)
                        }}
                        aria-label="Número da página"
                      />
                      <span className="text-muted-foreground">/ {pagination.totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!pagination.hasNext}
                      onClick={() => updateListUrl({ page: page + 1 })}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailClient(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detailClient && (
            <>
              <DialogHeader>
                <DialogTitle>{detailClient.name}</DialogTitle>
                <DialogDescription>
                  Dados completos do cadastro
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      detailClient.active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {detailClient.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="CPF" value={formatCpf(detailClient.cpf)} />
                  <DetailField label="Telefone" value={formatPhone(detailClient.phone)} />
                  <DetailField
                    label="E-mail"
                    value={detailClient.email}
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium text-foreground">Endereço / local</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailField label="Rua / logradouro" value={detailClient.street} />
                    <DetailField label="Bairro / comunidade" value={detailClient.neighborhood} />
                    <DetailField label="Cidade" value={detailClient.city} />
                    <DetailField label="UF" value={detailClient.state} />
                    <DetailField
                      label="CEP"
                      value={detailClient.zipCode ? formatZipCode(detailClient.zipCode) : null}
                    />
                    <DetailField
                      label="Ponto de referência"
                      value={detailClient.addressReference}
                    />
                  </div>
                  {addressLine && (
                    <p className="text-xs text-muted-foreground">{addressLine}</p>
                  )}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <DetailField label="Observações" value={detailClient.notes} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailField
                      label="Cadastrado em"
                      value={formatDisplayDate(detailClient.createdAt)}
                    />
                    <DetailField
                      label="Atualizado em"
                      value={formatDisplayDate(detailClient.updatedAt)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setDetailOpen(false)
                      router.push(`/clientes/${detailClient.id}`)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{clientToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
