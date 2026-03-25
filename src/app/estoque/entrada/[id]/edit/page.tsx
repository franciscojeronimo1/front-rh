"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ArrowLeft, Loader2, ArrowDown } from "lucide-react"
import {
  deleteStockEntry,
  getStockEntryById,
  updateStockEntry,
  type UpdateStockEntryRequest,
} from "@/lib/api"
import { ProductCombobox } from "@/components/product-combobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const entrySchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "deve ser maior que 0"),
  unitPrice: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Preço unitário deve ser maior que 0"),
  supplierName: z.string().optional(),
  supplierDoc: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
})

type EntryFormValues = z.infer<typeof entrySchema>

export default function EditarEntradaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [totalPrice, setTotalPrice] = useState(0)
  const [showSupplierFields, setShowSupplierFields] = useState(false)

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      productId: "",
      quantity: "",
      unitPrice: "",
      supplierName: "",
      supplierDoc: "",
      invoiceNumber: "",
      notes: "",
    },
  })

  const quantity = form.watch("quantity")
  const unitPrice = form.watch("unitPrice")

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setIsLoading(true)
        setError("")
        const { entry } = await getStockEntryById(id)
        form.reset({
          productId: entry.productId,
          quantity: entry.quantity.toString(),
          unitPrice: entry.unitPrice || "",
          supplierName: entry.supplierName || "",
          supplierDoc: entry.supplierDoc || "",
          invoiceNumber: entry.invoiceNumber || "",
          notes: entry.notes || "",
        })
        const qty = entry.quantity
        const price = parseFloat(entry.unitPrice) || 0
        setTotalPrice(qty * price)
        setShowSupplierFields(!!(entry.supplierName || entry.supplierDoc || entry.invoiceNumber))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar entrada")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, form])

  useEffect(() => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    if (qty > 0 && price > 0) {
      setTotalPrice(qty * price)
    } else {
      setTotalPrice(0)
    }
  }, [quantity, unitPrice])

  const onSubmit = async (data: EntryFormValues) => {
    try {
      setIsSubmitting(true)
      setError("")

      const requestData: UpdateStockEntryRequest = {
        productId: data.productId,
        quantity: parseFloat(data.quantity) || 0,
        unitPrice: parseFloat(data.unitPrice) || 0,
        supplierName: data.supplierName || undefined,
        supplierDoc: data.supplierDoc || undefined,
        invoiceNumber: data.invoiceNumber || undefined,
        notes: data.notes || undefined,
      }

      await updateStockEntry(id, requestData)
      router.push("/estoque/movimentacoes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar entrada")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError("")
      await deleteStockEntry(id)
      router.push("/estoque/movimentacoes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir entrada")
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/estoque/movimentacoes")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Editar Entrada</h1>
            <p className="text-muted-foreground">Altere os dados da entrada de material</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-success" />
              Editar Entrada de Estoque
            </CardTitle>
            <CardDescription>
              Ao alterar quantidade ou preço unitário, o custo médio do produto será atualizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Produto *</FormLabel>
                        <FormControl>
                          <ProductCombobox
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Digite para buscar produto..."
                          />
                        </FormControl>
                        <FormDescription>Produto que está entrando</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>Quantidade recebida</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Unitário *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormDescription>Preço por unidade</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(totalPrice)}
                    </span>
                  </div>
                </div>

                <Checkbox
                  id="show-supplier-fields"
                  checked={showSupplierFields}
                  onCheckedChange={(checked) => {
                    setShowSupplierFields(!!checked)
                    if (!checked) {
                      form.setValue("supplierName", "")
                      form.setValue("supplierDoc", "")
                      form.setValue("invoiceNumber", "")
                    }
                  }}
                >
                  <span className="text-sm font-medium leading-none">
                    Informar fornecedor/CNPJ ou Nota fiscal
                  </span>
                </Checkbox>

                {showSupplierFields && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="supplierName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Fornecedor</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Casa Elétrica Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplierDoc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ/CPF do Fornecedor</FormLabel>
                            <FormControl>
                              <Input placeholder="12.345.678/0001-90" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Nota Fiscal</FormLabel>
                          <FormControl>
                            <Input placeholder="NF-001234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações adicionais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isSubmitting || isDeleting}
                  >
                    Excluir entrada
                  </Button>
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/estoque/movimentacoes")}
                      disabled={isSubmitting || isDeleting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting || isDeleting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
          <DialogContent showCloseButton={!isDeleting}>
            <DialogHeader>
              <DialogTitle>Excluir esta entrada?</DialogTitle>
              <DialogDescription>
                O registro será removido e o estoque (e custo médio) do produto será revertido conforme a
                regra do sistema. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
