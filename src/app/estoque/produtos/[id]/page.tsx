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
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { getProductById, updateProduct, type Product, type UpdateProductRequest } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  code: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  minStock: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, "Estoque mínimo deve ser >= 0"),
  unit: z.string().optional(),
  costPrice: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, "Preço deve ser >= 0"),
  active: z.boolean().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        const response = await getProductById(productId)
        setProduct(response.product)
        form.reset({
          name: response.product.name,
          code: response.product.code || "",
          sku: response.product.sku || "",
          category: response.product.category || "",
          minStock: response.product.minStock.toString(),
          unit: response.product.unit,
          costPrice: response.product.costPrice || "",
          active: response.product.active,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar produto")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId, form])

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSaving(true)
      setError("")

      const requestData: UpdateProductRequest = {
        name: data.name,
        code: data.code || undefined,
        sku: data.sku || undefined,
        category: data.category || undefined,
        minStock: data.minStock ? parseFloat(data.minStock) : undefined,
        unit: data.unit,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        active: data.active,
      }

      await updateProduct(productId, requestData)
      router.push("/estoque/produtos")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar produto")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Produto não encontrado</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/estoque/produtos")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Editar Produto</h1>
            <p className="text-muted-foreground">Atualize as informações do produto</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>Atualize os dados do produto</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cabo Elétrico 2.5mm" {...field} />
                      </FormControl>
                      <FormDescription>Nome do produto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: CAB-001" {...field} />
                        </FormControl>
                        <FormDescription>Código interno do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SKU-001" {...field} />
                        </FormControl>
                        <FormDescription>Código SKU do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cabos" {...field} />
                      </FormControl>
                      <FormDescription>Categoria do produto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>Quantidade mínima em estoque</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <FormControl>
                          <Input placeholder="UN, MT, KG..." {...field} />
                        </FormControl>
                        <FormDescription>Unidade de medida</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Preço de custo unitário</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Produto Ativo</FormLabel>
                        <FormDescription>Produtos inativos não aparecem nas listagens</FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Informações de Estoque</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estoque Atual:</span>
                      <p className="font-bold">{product.currentStock} {product.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo Médio:</span>
                      <p className="font-bold">
                        {product.averageCost
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(parseFloat(product.averageCost))
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/estoque/produtos")}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
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

