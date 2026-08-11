"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { pdf } from "@react-pdf/renderer"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { BookletPdfDocument } from "@/components/carne/BookletPdfDocument"
import {
  getBookletById,
  updateBookletParcel,
  type Booklet,
  type BookletParcelStatus,
} from "@/lib/api"
import { getBookletPaymentSummary } from "@/lib/carne"
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

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

const statusLabel: Record<BookletParcelStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
}

export default function CarneDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const bookletId = params.bookletId as string

  const [booklet, setBooklet] = useState<Booklet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [error, setError] = useState("")
  const [updatingParcelId, setUpdatingParcelId] = useState<string | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError("")
      const res = await getBookletById(bookletId)
      setBooklet(res.booklet)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar carnê")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bookletId) load()
  }, [bookletId])

  const downloadPdf = async () => {
    if (!booklet) return
    try {
      setIsPdfLoading(true)
      const blob = await pdf(<BookletPdfDocument booklet={booklet} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `carne-${booklet.client?.name?.replace(/\s+/g, "-").toLowerCase() ?? booklet.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF")
    } finally {
      setIsPdfLoading(false)
    }
  }

  const openPdfPrint = async () => {
    if (!booklet) return
    try {
      setIsPdfLoading(true)
      const blob = await pdf(<BookletPdfDocument booklet={booklet} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir PDF")
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleStatusChange = async (parcelId: string, status: BookletParcelStatus) => {
    try {
      setUpdatingParcelId(parcelId)
      await updateBookletParcel(bookletId, parcelId, status)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar parcela")
    } finally {
      setUpdatingParcelId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!booklet) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error || "Carnê não encontrado"}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push(`/clientes/${clientId}/carnes`)}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const summary = getBookletPaymentSummary(booklet)
  const progress =
    booklet.installmentCount > 0
      ? Math.min(100, (summary.paidCount / booklet.installmentCount) * 100)
      : 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0"
              onClick={() => router.push(`/clientes/${clientId}/carnes`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {booklet.description || "Carnê de pagamento"}
              </h1>
              <p className="text-muted-foreground">
                {booklet.client?.name} · {booklet.installmentCount}x de{" "}
                {formatMoney(booklet.installmentAmount)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openPdfPrint} disabled={isPdfLoading}>
              {isPdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Abrir para imprimir
            </Button>
            <Button onClick={downloadPdf} disabled={isPdfLoading}>
              {isPdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar PDF
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Acompanhe o recebimento das parcelas deste carnê
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(booklet.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Já pago</p>
                <p className="text-lg font-semibold tabular-nums text-success">
                  {formatMoney(summary.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Em aberto</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(summary.openAmount)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {summary.paidCount} de {booklet.installmentCount} parcelas pagas
              </p>
            </div>
            <div className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{booklet.client?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">1º vencimento</p>
                <p className="font-medium">{formatDate(booklet.firstDueDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próximo vencimento</p>
                <p className="font-medium">
                  {summary.nextDueDate ? formatDate(summary.nextDueDate) : "Quitado"}
                </p>
              </div>
              {booklet.notes ? (
                <div className="sm:col-span-3">
                  <p className="text-muted-foreground">Observações</p>
                  <p>{booklet.notes}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parcelas</CardTitle>
            <CardDescription>Marque como pago conforme o recebimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booklet.parcels.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell>{parcel.number}</TableCell>
                      <TableCell>{formatDate(parcel.dueDate)}</TableCell>
                      <TableCell>{formatMoney(parcel.amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={parcel.status}
                          disabled={updatingParcelId === parcel.id}
                          onValueChange={(value) =>
                            handleStatusChange(parcel.id, value as BookletParcelStatus)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[140px]",
                              parcel.status === "PAID" && "border-success/40",
                              parcel.status === "CANCELLED" && "opacity-70"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusLabel) as BookletParcelStatus[]).map((s) => (
                              <SelectItem key={s} value={s}>
                                {statusLabel[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
