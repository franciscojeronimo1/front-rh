"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, ArrowUp, AlertTriangle } from "lucide-react"
import {
  getProducts,
  createStockExit,
  type Product,
  type CreateStockExitRequest,
} from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

const exitSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Quantidade deve ser maior que 0"),
  projectName: z.string().optional(),
  clientName: z.string().optional(),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
})

type ExitFormValues = z.infer<typeof exitSchema>

export default function RegistrarSaidaPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<ExitFormValues>({
    resolver: zodResolver(exitSchema),
    defaultValues: {
      productId: "",
      quantity: "",
      projectName: "",
      clientName: "",
      serviceType: "",
      notes: "",
    },
  })

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const response = await getProducts(undefined, true)
        setProducts(response.products.filter((p) => p.currentStock > 0))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar produtos")
      } finally {
        setIsLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])

  const productId = form.watch("productId")

  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [productId, products])

  const onSubmit = async (data: ExitFormValues) => {
    try {
      setIsSubmitting(true)
      setError("")

      const quantityNum = parseFloat(data.quantity) || 0
      
      if (selectedProduct && quantityNum > selectedProduct.currentStock) {
        setError(
          `Quantidade solicitada (${quantityNum}) é maior que o estoque disponível (${selectedProduct.currentStock})`
        )
        setIsSubmitting(false)
        return
      }

      const requestData: CreateStockExitRequest = {
        productId: data.productId,
        quantity: quantityNum,
        projectName: data.projectName || undefined,
        clientName: data.clientName || undefined,
        serviceType: data.serviceType || undefined,
        notes: data.notes || undefined,
      }

      await createStockExit(requestData)
      router.push("/estoque")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar saída")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/estoque")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Registrar Saída</h1>
            <p className="text-muted-foreground">Registre o uso ou consumo de material</p>
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
              Saída de Estoque
            </CardTitle>
            <CardDescription>Preencha os dados da saída de material</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingProducts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.code && `(${product.code})`} - Estoque:{" "}
                              {product.currentStock} {product.unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Selecione o produto que está saindo</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProduct && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Estoque Disponível</p>
                        <p className="text-2xl font-bold">
                          {selectedProduct.currentStock} {selectedProduct.unit}
                        </p>
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
                        Quantidade utilizada (máximo: {selectedProduct?.currentStock || 0}{" "}
                        {selectedProduct?.unit || ""})
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instalação Residencial" {...field} />
                      </FormControl>
                      <FormDescription>Nome do projeto ou serviço</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: João Silva" {...field} />
                        </FormControl>
                        <FormDescription>Nome do cliente</FormDescription>
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
                        <FormDescription>Tipo de serviço realizado</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações adicionais..." {...field} />
                      </FormControl>
                      <FormDescription>Informações adicionais sobre o uso</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/estoque")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isLoadingProducts}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Registrar Saída
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

