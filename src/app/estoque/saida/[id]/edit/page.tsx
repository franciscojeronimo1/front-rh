"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { ArrowLeft, Loader2, ArrowUp, AlertTriangle } from "lucide-react"
import {
  getStockExitById,
  getProductById,
  updateStockExit,
  type Product,
  type UpdateStockExitRequest,
} from "@/lib/api"
import { ProductCombobox } from "@/components/product-combobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

const baseExitSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "deve ser maior que 0"),
  unitPrice: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, "Preço unitário deve ser maior que 0 quando informado"),
  projectName: z.string().optional(),
  clientName: z.string().optional(),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
})

const exitSchema = baseExitSchema

type ExitFormValues = z.infer<typeof baseExitSchema>

export default function EditarSaidaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [totalPricePreview, setTotalPricePreview] = useState(0)
  const [showProjectFields, setShowProjectFields] = useState(false)
  const productRef = useRef<Product | null>(null)
  productRef.current = selectedProduct

  const schemaWithStock = useMemo(
    () =>
      exitSchema.superRefine((data, ctx) => {
        const product = productRef.current
        if (!product) return
        const qty = parseFloat(data.quantity) || 0
        const stock = product.currentStock ?? 0
        if (qty > stock) {
          const unit = (product.unit ?? "").trim()
          const suffix = unit ? ` (${stock} ${unit})` : ` (${stock})`
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Quantidade não pode exceder o estoque disponível${suffix}`,
            path: ["quantity"],
          })
        }
      }),
    []
  )

  const form = useForm<ExitFormValues>({
    resolver: zodResolver(schemaWithStock),
    defaultValues: {
      productId: "",
      quantity: "",
      unitPrice: "",
      projectName: "",
      clientName: "",
      serviceType: "",
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
        const { exit } = await getStockExitById(id)
        const { product } = await getProductById(exit.productId)
        setSelectedProduct(product)
        form.reset({
          productId: exit.productId,
          quantity: exit.quantity.toString(),
          unitPrice: exit.unitPrice || "",
          projectName: exit.projectName || "",
          clientName: exit.clientName || "",
          serviceType: exit.serviceType || "",
          notes: exit.notes || "",
        })
        const qty = exit.quantity
        const price = parseFloat(exit.unitPrice || "0") || 0
        setTotalPricePreview(qty * price)
        setShowProjectFields(!!(exit.projectName || exit.clientName || exit.serviceType))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar saída")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, form])

  useEffect(() => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice || "") || 0
    if (qty > 0 && price > 0) {
      setTotalPricePreview(qty * price)
    } else {
      setTotalPricePreview(0)
    }
  }, [quantity, unitPrice])

  const onSubmit = async (data: ExitFormValues) => {
    try {
      setIsSubmitting(true)
      setError("")

      const quantityNum = parseFloat(data.quantity) || 0

      const { product: freshProduct } = await getProductById(data.productId)
      if (quantityNum > freshProduct.currentStock) {
        setError(
          `Quantidade solicitada (${quantityNum}) é maior que o estoque disponível (${freshProduct.currentStock} ${freshProduct.unit}). O estoque pode ter sido alterado.`
        )
        setSelectedProduct(freshProduct)
        setIsSubmitting(false)
        return
      }

      const unitPriceNum = data.unitPrice?.trim()
        ? parseFloat(data.unitPrice)
        : undefined
      const hasValidUnitPrice =
        typeof unitPriceNum === "number" && !isNaN(unitPriceNum) && unitPriceNum > 0

      const requestData: UpdateStockExitRequest = {
        productId: data.productId,
        quantity: quantityNum,
        ...(hasValidUnitPrice && { unitPrice: unitPriceNum }),
        projectName: data.projectName || undefined,
        clientName: data.clientName || undefined,
        serviceType: data.serviceType || undefined,
        notes: data.notes || undefined,
      }

      await updateStockExit(id, requestData)
      router.push("/estoque/movimentacoes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar saída")
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Editar Saída</h1>
            <p className="text-muted-foreground">Altere os dados da saída de material</p>
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
              <ArrowUp className="h-5 w-5 text-destructive" />
              Editar Saída de Estoque
            </CardTitle>
            <CardDescription>
              Ao alterar quantidade ou produto, o serviço reverte a saída anterior e aplica a nova
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
                            onProductSelect={setSelectedProduct}
                            placeholder="Digite para buscar produto..."
                            showStock
                          />
                        </FormControl>
                        <FormDescription>Produto que está saindo</FormDescription>
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
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            max={selectedProduct?.currentStock}
                          />
                        </FormControl>
                        <FormDescription>
                          (máximo: {selectedProduct?.currentStock ?? 0}{" "}
                          {selectedProduct?.unit ?? ""})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço unitário de venda</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Venda ao cliente</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedProduct && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium">Estoque Disponível</p>
                          <p className="text-2xl font-bold">
                            {selectedProduct.currentStock} {selectedProduct.unit}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-border hidden sm:block" />
                        <div>
                          <p className="text-sm font-medium">Total da venda</p>
                          <p className="text-2xl font-bold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(totalPricePreview)}
                          </p>
                        </div>
                      </div>
                      {selectedProduct.currentStock < selectedProduct.minStock && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="text-sm font-medium">Estoque Baixo</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Checkbox
                  id="show-project-fields"
                  checked={showProjectFields}
                  onCheckedChange={(checked) => {
                    setShowProjectFields(!!checked)
                    if (!checked) {
                      form.setValue("projectName", "")
                      form.setValue("clientName", "")
                      form.setValue("serviceType", "")
                    }
                  }}
                >
                  <span className="text-sm font-medium leading-none">
                    Deseja informar projeto, cliente ou tipo de serviço?
                  </span>
                </Checkbox>

                {showProjectFields && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Projeto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Instalação Residencial" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Serviço</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Instalação Elétrica" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/estoque/movimentacoes")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Salvar alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
