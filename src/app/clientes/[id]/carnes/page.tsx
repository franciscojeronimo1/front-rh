"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  deleteBooklet,
  getBooklets,
  getClientById,
  type Booklet,
  type Client,
} from "@/lib/api"
import { ArrowLeft, FileText, Loader2, Plus, Trash2 } from "lucide-react"

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(n)) return "R$ 0,00"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string): string {
  const datePart = iso.includes("T") ? iso.split("T")[0] : iso
  const [y, m, d] = datePart.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export default function ClienteCarnesPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [booklets, setBooklets] = useState<Booklet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [toDelete, setToDelete] = useState<Booklet | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = async () => {
    try {
      setIsLoading(true)
      setError("")
      const [clientRes, bookletsRes] = await Promise.all([
        getClientById(clientId),
        getBooklets(clientId),
      ])
      setClient(clientRes.client)
      setBooklets(bookletsRes.booklets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar carnês")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) load()
  }, [clientId])

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      setIsDeleting(true)
      const res = await deleteBooklet(toDelete.id)
      setSuccess(res.message || "Carnê excluído")
      setToDelete(null)
      await load()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir carnê")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/clientes")}
              className="mt-1 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Carnês</h1>
              <p className="text-muted-foreground">
                {client ? client.name : "Carregando cliente..."}
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/clientes/${clientId}/carnes/novo`)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo carnê
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
          <CardHeader>
            <CardTitle>Carnês do cliente</CardTitle>
            <CardDescription>
              Gere parcelas e imprima o PDF profissional para entrega
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : booklets.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                Nenhum carnê cadastrado para este cliente.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>1º vencimento</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booklets.map((booklet) => (
                      <TableRow key={booklet.id}>
                        <TableCell className="font-medium">
                          {booklet.description || "Carnê de pagamento"}
                        </TableCell>
                        <TableCell>{booklet.installmentCount}x</TableCell>
                        <TableCell>
                          {formatMoney(booklet.installmentAmount)}
                          <span className="block text-xs text-muted-foreground">
                            Total {formatMoney(booklet.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(booklet.firstDueDate)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/clientes/${clientId}/carnes/${booklet.id}`)
                              }
                            >
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              Abrir
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setToDelete(booklet)}
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir carnê</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este carnê e todas as parcelas?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting}>
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
